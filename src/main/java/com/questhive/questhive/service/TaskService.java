package com.questhive.questhive.service;

import com.questhive.questhive.model.GroupActivity;
import com.questhive.questhive.model.Task;
import com.questhive.questhive.model.Task.Priority;
import com.questhive.questhive.model.Task.Status;
import com.questhive.questhive.model.Task.Category;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.GroupActivityRepository;
import com.questhive.questhive.repository.TaskRepository;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final RewardService rewardService;
    private final GroupActivityRepository groupActivityRepository; // ← NEW

    public Task createGroupTask(String assignedById, String assignedToId, String groupId,
                                String title, String description, Priority priority,
                                Category category, LocalDateTime deadline, Integer bonusCoins) {

        groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));

        if (assignedToId != null && !assignedToId.isEmpty()) {
            userRepository.findById(assignedToId)
                    .orElseThrow(() -> new RuntimeException("Assigned user not found."));
        } else {
            assignedToId = null;
        }

        Task task = new Task();
        task.setTitle(title);
        task.setDescription(description);
        task.setGroupId(groupId);
        task.setAssignedById(assignedById);
        task.setAssignedToId(assignedToId);
        task.setPriority(priority);
        task.setCategory(category);
        task.setDeadline(deadline);
        task.setStatus(Status.PENDING);
        task.setPersonal(false);
        task.setCoinsReward(baseCoins(priority) + (bonusCoins != null ? bonusCoins : 0));
        task.setCreatedAt(LocalDateTime.now());

        Task saved = taskRepository.save(task);

        // Log activity + send email if assigned to someone
        if (assignedToId != null) {
            String finalAssignedToId = assignedToId;
            userRepository.findById(assignedToId).ifPresent(assignee -> {
                userRepository.findById(assignedById).ifPresent(assigner -> {
                    emailService.sendTaskAssignedNotification(
                            assignee.getEmail(), assigner.getFullName(), title,
                            priority.name(), deadline != null ? deadline.toString() : "No deadline");
                    // ← Activity log
                    logActivity(groupId, "TASK_ASSIGNED", assigner.getFullName(), assignee.getFullName(), title, 0);
                });
            });
        } else {
            // Open task posted
            userRepository.findById(assignedById).ifPresent(assigner ->
                    logActivity(groupId, "TASK_ASSIGNED", assigner.getFullName(), "Open (anyone can claim)", title, 0));
        }

        return saved;
    }

    public Task createPersonalTask(String userId, String title, String description,
                                   Priority priority, Category category, LocalDateTime deadline) {
        Task task = new Task();
        task.setTitle(title);
        task.setDescription(description);
        task.setAssignedById(userId);
        task.setAssignedToId(userId);
        task.setPriority(priority);
        task.setCategory(category);
        task.setDeadline(deadline);
        task.setStatus(Status.PENDING);
        task.setPersonal(true);
        task.setCoinsReward(0);
        task.setCreatedAt(LocalDateTime.now());
        return taskRepository.save(task);
    }

    public Task updateStatus(String userId, String taskId, Status newStatus) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found."));

        if (!userId.equals(task.getAssignedToId())) {
            throw new RuntimeException("You can only update status of tasks assigned to you.");
        }

        task.setStatus(newStatus);

        if (newStatus == Status.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
            if (task.getGroupId() != null) {
                rewardService.handleTaskCompletion(userId, task);
                // ← Activity log
                userRepository.findById(userId).ifPresent(user ->
                        logActivity(task.getGroupId(), "TASK_COMPLETED", user.getFullName(), null, task.getTitle(), task.getCoinsReward()));
            }
        }

        return taskRepository.save(task);
    }

    public Task claimTask(String userId, String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found."));

        if (task.getAssignedToId() != null) {
            throw new RuntimeException("This task has already been claimed.");
        }

        task.setAssignedToId(userId);

        // ← Activity log
        userRepository.findById(userId).ifPresent(user ->
                logActivity(task.getGroupId(), "TASK_CLAIMED", user.getFullName(), null, task.getTitle(), 0));

        return taskRepository.save(task);
    }

    // deny a task
    public Task denyTask(String userId, String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found."));

        if (!userId.equals(task.getAssignedToId())) {
            throw new RuntimeException("You can only deny tasks assigned to you.");
        }
        if (task.getStatus() == Status.COMPLETED) {
            throw new RuntimeException("Cannot deny a completed task.");
        }
        if (task.isPersonal()) {
            throw new RuntimeException("Cannot deny a personal task.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        // HIGH priority denial → deduct 5 coins, add +5 bonus for whoever accepts
        if (task.getPriority() == Priority.HIGH) {
            user.setCoins(Math.max(0, user.getCoins() - 5));
            userRepository.save(user);
            task.setOpenTaskBonus(true);
            task.setCoinsReward(task.getCoinsReward() + 5); // bonus for next person
            logActivity(task.getGroupId(), "TASK_DENIED", user.getFullName(), null,
                    task.getTitle() + " (HIGH priority — -5 coins, +5 bonus added)", -5);
        } else {
            logActivity(task.getGroupId(), "TASK_DENIED", user.getFullName(), null, task.getTitle(), 0);
        }

        // Reopen the task
        task.setAssignedToId(null);
        task.setStatus(Status.PENDING);
        return taskRepository.save(task);
    }

    // open task 6hr/8hr notification flow (replaces auto-assign)
    public void processOpenTaskNotifications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sixHoursAgo = now.minusHours(6);
        LocalDateTime twoHoursAgo = now.minusHours(2);

        List<Task> openTasks = taskRepository
                .findByAssignedToIdIsNullAndGroupIdIsNotNullAndCreatedAtBefore(sixHoursAgo);

        for (Task task : openTasks) {
            String groupId = task.getGroupId();
            var group = groupRepository.findById(groupId).orElse(null);
            if (group == null) continue;

            // 8hr+ (2hr after notification) → deduct 5 coins from all members
            if (task.getOpenTaskNotifiedAt() != null &&
                    task.getOpenTaskNotifiedAt().isBefore(twoHoursAgo)) {

                for (String memberId : group.getMemberIds()) {
                    userRepository.findById(memberId).ifPresent(member -> {
                        member.setCoins(Math.max(0, member.getCoins() - 5));
                        userRepository.save(member);
                        emailService.sendOpenTaskFinalWarning(member.getEmail(), task.getTitle(), group.getName());
                    });
                }
                logActivity(groupId, "OPEN_TASK_PENALTY", "System", null,
                        "\"" + task.getTitle() + "\" unclaimed — all members -5 coins", -5);

                // Auto-assign to admin as last resort so it doesn't loop
                userRepository.findById(group.getAdminId()).ifPresent(admin -> {
                    task.setAssignedToId(admin.getId());
                    task.setOpenTaskNotifiedAt(null);
                    taskRepository.save(task);
                });

                // 6hr+ with no notification yet → notify all members
            } else if (task.getOpenTaskNotifiedAt() == null) {
                for (String memberId : group.getMemberIds()) {
                    userRepository.findById(memberId).ifPresent(member ->
                            emailService.sendOpenTaskReminder(member.getEmail(), task.getTitle(), group.getName()));
                }
                task.setOpenTaskNotifiedAt(now);
                taskRepository.save(task);
                logActivity(groupId, "OPEN_TASK_REMINDER", "System", null,
                        "\"" + task.getTitle() + "\" unclaimed for 6 hours — members notified", 0);
            }
        }
    }

    public List<Task> getTasksForGroup(String groupId) {
        groupRepository.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found."));
        return taskRepository.findByGroupId(groupId);
    }

    public List<Task> getMyTasks(String userId) {
        return taskRepository.findByAssignedToId(userId);
    }

    public List<Task> getMyPersonalTasks(String userId) {
        return taskRepository.findByAssignedToIdAndIsPersonal(userId, true);
    }

    public List<Task> getMyTasksByStatus(String userId, Status status) {
        return taskRepository.findByAssignedToIdAndStatus(userId, status);
    }

    public List<Task> getGroupTasksByStatus(String groupId, Status status) {
        return taskRepository.findByGroupIdAndStatus(groupId, status);
    }

    public List<Task> getTasksAssignedByMe(String userId, String groupId) {
        return taskRepository.findByAssignedByIdAndGroupId(userId, groupId);
    }

    public Task editTask(String requesterId, String taskId, String title, String description,
                         Priority priority, Category category, LocalDateTime deadline, Integer bonusCoins) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found."));
        if (!task.getAssignedById().equals(requesterId)) {
            throw new RuntimeException("Only the task assigner can edit this task.");
        }
        if (title != null) task.setTitle(title);
        if (description != null) task.setDescription(description);
        if (priority != null) {
            task.setPriority(priority);
            task.setCoinsReward(baseCoins(priority) + (bonusCoins != null ? bonusCoins : 0));
        }
        if (category != null) task.setCategory(category);
        if (deadline != null) task.setDeadline(deadline);
        return taskRepository.save(task);
    }

    public void deleteTask(String requesterId, String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found."));
        if (!task.getAssignedById().equals(requesterId)) {
            throw new RuntimeException("Only the task assigner can delete this task.");
        }
        taskRepository.delete(task);
    }

    public boolean hasRecurringPattern(String userId, Category category) {
        List<Task> completed = taskRepository.findByAssignedToIdAndStatus(userId, Status.COMPLETED);
        LocalDateTime now = LocalDateTime.now();
        for (int i = 1; i <= 3; i++) {
            LocalDateTime dayStart = now.minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            boolean completedOnDay = completed.stream()
                    .filter(t -> t.getCategory() == category)
                    .filter(t -> t.getCompletedAt() != null)
                    .anyMatch(t -> t.getCompletedAt().isAfter(dayStart) && t.getCompletedAt().isBefore(dayEnd));
            if (!completedOnDay) return false;
        }
        return true;
    }

    private int baseCoins(Priority priority) {
        return switch (priority) {
            case LOW -> 5;
            case MEDIUM -> 10;
            case HIGH -> 20;
        };
    }

    private void logActivity(String groupId, String type, String actorName, String targetName, String detail, int coins) {
        if (groupId == null) return;
        GroupActivity activity = new GroupActivity();
        activity.setGroupId(groupId);
        activity.setType(type);
        activity.setActorName(actorName);
        activity.setTargetName(targetName);
        activity.setDetail(detail);
        activity.setCoins(coins);
        groupActivityRepository.save(activity);
    }
}