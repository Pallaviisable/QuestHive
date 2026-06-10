package com.questhive.questhive.service;

import com.questhive.questhive.model.Group;
import com.questhive.questhive.model.GroupActivity;
import com.questhive.questhive.model.Task;
import com.questhive.questhive.model.Task.Priority;
import com.questhive.questhive.model.Task.Status;
import com.questhive.questhive.model.Task.Category;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.GroupActivityRepository;
import com.questhive.questhive.service.NotificationService;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.TaskRepository;
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
    private final NotificationService notificationService;
    private final RewardService rewardService;
    private final XpService xpService;
    private final GroupActivityRepository groupActivityRepository;

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
        int totalCoins = baseCoins(priority) + (bonusCoins != null ? bonusCoins : 0);
        task.setCoinsReward(totalCoins);
        if (bonusCoins != null && bonusCoins >= 50) {
            task.setPendingPeerReview(true);
            task.setBonusCoinsAmount(bonusCoins);
            task.setPeerReviewDeadline(LocalDateTime.now().plusHours(24));
        }
        task.setCreatedAt(LocalDateTime.now());

        Task saved = taskRepository.save(task);

        if (assignedToId != null) {
            String finalAssignedToId = assignedToId;
            userRepository.findById(assignedToId).ifPresent(assignee ->
                userRepository.findById(assignedById).ifPresent(assigner -> {
                    emailService.sendTaskAssignedNotification(
                            assignee.getEmail(), assigner.getFullName(), title,
                            priority.name(), deadline != null ? deadline.toString() : "No deadline");
                    logActivity(groupId, "TASK_ASSIGNED", assigner.getFullName(), assignee.getFullName(), title, 0);
                    notificationService.sendNotification(finalAssignedToId, "📋 New Task Assigned",
                        assigner.getFullName() + " assigned you: " + title, "TASK_ASSIGNED", groupId, saved.getId());
                })
            );
        } else {
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
                int xpAmount = switch (task.getPriority()) {
                    case HIGH   -> 50;
                    case MEDIUM -> 25;
                    default     -> 10;
                };
                xpService.awardXp(userId, task.getGroupId(), xpAmount, "Completed task: " + task.getTitle());
                userRepository.findById(userId).ifPresent(user -> {
                    logActivity(task.getGroupId(), "TASK_COMPLETED", user.getFullName(), null, task.getTitle(), task.getCoinsReward());
                    // Check pledge - fulfilled if completed on or before deadline
                    if (task.getPledgeMessage() != null && !task.getPledgeMessage().isEmpty()) {
                        boolean onTime = task.getDeadline() == null || !LocalDateTime.now().isAfter(task.getDeadline());
                        String pledgeType = onTime ? "PLEDGE_FULFILLED" : "PLEDGE_MISSED";
                        String pledgeDetail = onTime
                            ? "fulfilled pledge on task: " + task.getTitle()
                            : "missed pledge on task: " + task.getTitle();
                        logActivity(task.getGroupId(), pledgeType, user.getFullName(), null, pledgeDetail, 0);
                    }
                    // Notify all group members
                    groupRepository.findById(task.getGroupId()).ifPresent(group ->
                        group.getMemberIds().stream()
                            .filter(mid -> !mid.equals(userId))
                            .forEach(mid -> notificationService.sendNotification(mid,
                                "✅ Task Completed",
                                user.getFullName() + " completed: " + task.getTitle(),
                                "TASK_COMPLETED", task.getGroupId(), task.getId()))
                    );
                });
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
        userRepository.findById(userId).ifPresent(user ->
            logActivity(task.getGroupId(), "TASK_CLAIMED", user.getFullName(), null, task.getTitle(), 0));
        userRepository.findById(userId).ifPresent(claimer ->
            notificationService.sendNotification(task.getAssignedById(), "🙋 Task Claimed",
                claimer.getFullName() + " claimed: " + task.getTitle(),
                "TASK_CLAIMED", task.getGroupId(), task.getId()));
        return taskRepository.save(task);
    }

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

        if (task.getPriority() == Priority.HIGH) {
            user.setCoins(Math.max(0, user.getCoins() - 5));
            userRepository.save(user);
            task.setOpenTaskBonus(true);
            task.setCoinsReward(task.getCoinsReward() + 5);
            logActivity(task.getGroupId(), "TASK_DENIED", user.getFullName(), null,
                    task.getTitle() + " (HIGH priority — -5 coins, +5 bonus added)", -5);
        } else {
            logActivity(task.getGroupId(), "TASK_DENIED", user.getFullName(), null, task.getTitle(), 0);
        }

        task.setAssignedToId(null);
        task.setStatus(Status.PENDING);
        return taskRepository.save(task);
    }

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
                userRepository.findById(group.getAdminId()).ifPresent(admin -> {
                    task.setAssignedToId(admin.getId());
                    task.setOpenTaskNotifiedAt(null);
                    taskRepository.save(task);
                });
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

    // Enhancement #7: only admin or task creator can edit
    public Task editTask(String requesterId, String taskId, String title, String description,
                         Priority priority, Category category, LocalDateTime deadline, Integer bonusCoins) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found."));

        // Get group to check if requester is admin
        boolean isGroupAdmin = false;
        if (task.getGroupId() != null) {
            Group group = groupRepository.findById(task.getGroupId()).orElse(null);
            if (group != null) isGroupAdmin = group.getAdminId().equals(requesterId);
        }

        if (!task.getAssignedById().equals(requesterId) && !isGroupAdmin) {
            throw new RuntimeException("Only the task creator or group admin can edit this task.");
        }

        if (title != null) task.setTitle(title);
        if (description != null) task.setDescription(description);
        if (priority != null) {
            task.setPriority(priority);
            int editedCoins = baseCoins(priority) + (bonusCoins != null ? bonusCoins : 0);
            task.setCoinsReward(editedCoins);
            if (bonusCoins != null && bonusCoins >= 50) {
                task.setPendingPeerReview(true);
                task.setBonusCoinsAmount(bonusCoins);
                task.setPeerReviewDeadline(LocalDateTime.now().plusHours(24));
            }
        }
        if (category != null) task.setCategory(category);
        if (deadline != null) task.setDeadline(deadline);
        return taskRepository.save(task);
    }

    // Enhancement #7: only admin or task creator can delete
    public void deleteTask(String requesterId, String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found."));

        boolean isGroupAdmin = false;
        if (task.getGroupId() != null) {
            Group group = groupRepository.findById(task.getGroupId()).orElse(null);
            if (group != null) isGroupAdmin = group.getAdminId().equals(requesterId);
        }

        if (!task.getAssignedById().equals(requesterId) && !isGroupAdmin) {
            throw new RuntimeException("Only the task creator or group admin can delete this task.");
        }
        taskRepository.delete(task);
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

    // Bug #6: auto-complete parent task when all subtasks are done
    public Task completeSubtask(String taskId, String subtaskId) {
        Task task = getTask(taskId);

        task.getSubtasks().stream()
                .filter(s -> subtaskId.equals(s.getId()))
                .findFirst()
                .ifPresent(s -> {
                    s.setCompleted(true);
                    s.setCompletedAt(LocalDateTime.now());
                });

        // Auto-complete parent if all subtasks done
        boolean allDone = !task.getSubtasks().isEmpty() &&
                task.getSubtasks().stream().allMatch(Task.Subtask::isCompleted);
        if (allDone && task.getStatus() != Status.COMPLETED) {
            task.setStatus(Status.COMPLETED);
            task.setCompletedAt(LocalDateTime.now());
            if (task.getGroupId() != null && task.getAssignedToId() != null) {
                rewardService.handleTaskCompletion(task.getAssignedToId(), task);
                int xpAmount = switch (task.getPriority()) {
                    case HIGH   -> 50;
                    case MEDIUM -> 25;
                    default     -> 10;
                };
                xpService.awardXp(task.getAssignedToId(), task.getGroupId(), xpAmount,
                        "Auto-completed via subtasks: " + task.getTitle());
                userRepository.findById(task.getAssignedToId()).ifPresent(user ->
                    logActivity(task.getGroupId(), "TASK_COMPLETED", user.getFullName(), null,
                            task.getTitle() + " (all subtasks done)", task.getCoinsReward()));
            }
        }

        return taskRepository.save(task);
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

    public Task updateTaskPriority(String requesterId, String taskId, Priority newPriority) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        Group group = groupRepository.findById(task.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));
        if (!group.getAdminId().equals(requesterId)) {
            throw new RuntimeException("Only the group admin can change task priority");
        }
        if (task.getStatus() == Status.COMPLETED) {
            throw new RuntimeException("Cannot change priority of a completed task");
        }
        Priority oldPriority = task.getPriority();
        int bonusCoins = Math.max(0, task.getCoinsReward() - baseCoins(oldPriority));
        task.setPriority(newPriority);
        task.setCoinsReward(baseCoins(newPriority) + bonusCoins);
        taskRepository.save(task);
        userRepository.findById(requesterId).ifPresent(requester ->
            logActivity(task.getGroupId(), "PRIORITY_CHANGED", requester.getFullName(), null,
                    "\"" + task.getTitle() + "\" priority changed from " + oldPriority.name() + " → " + newPriority.name(), 0));
        return task;
    }

    public Task getTask(String taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    public Task addComment(String taskId, String userId, String content) {
        Task task = getTask(taskId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Task.TaskComment comment = new Task.TaskComment();
        comment.setId(java.util.UUID.randomUUID().toString());
        comment.setUserId(userId);
        comment.setAuthorName(user.getFullName() != null ? user.getFullName() : user.getUsername());
        comment.setContent(content);
        comment.setCreatedAt(LocalDateTime.now());
        task.getComments().add(comment);
        // Notify assignee if commenter is not assignee
        if (task.getAssignedToId() != null && !task.getAssignedToId().equals(userId)) {
            notificationService.sendNotification(task.getAssignedToId(), "💬 New Comment",
                user.getFullName() + " commented on: " + task.getTitle(),
                "TASK_COMMENT", task.getGroupId(), taskId);
        }
        return taskRepository.save(task);
    }

    public Task addSubtask(String taskId, String title) {
        Task task = getTask(taskId);
        Task.Subtask subtask = new Task.Subtask();
        subtask.setId(java.util.UUID.randomUUID().toString());
        subtask.setTitle(title);
        subtask.setCompleted(false);
        task.getSubtasks().add(subtask);
        return taskRepository.save(task);
    }

    public Task addPledge(String taskId, String userId, String message) {
        Task task = getTask(taskId);
        task.setPledgeMessage(message);
        task.setPledgedAt(LocalDateTime.now());
        task.setPledgedByUserId(userId);
        Task saved = taskRepository.save(task);
        // Log pledge in group activity feed + notify group members
        if (task.getGroupId() != null) {
            userRepository.findById(userId).ifPresent(user -> {
                logActivity(task.getGroupId(), "PLEDGE_MADE", user.getFullName(), null,
                    "pledged on task: " + task.getTitle(), 0);
                groupRepository.findById(task.getGroupId()).ifPresent(group ->
                    group.getMemberIds().stream()
                        .filter(mid -> !mid.equals(userId))
                        .forEach(mid -> notificationService.sendNotification(mid,
                            "🤝 New Pledge",
                            user.getFullName() + " pledged on: " + task.getTitle(),
                            "PLEDGE_MADE", task.getGroupId(), taskId))
                );
            });
        }
        return saved;
    }

    private int baseCoins(Priority priority) {
        return switch (priority) {
            case LOW -> 5;
            case MEDIUM -> 10;
            case HIGH -> 20;
        };
    }

    private void logActivity(String groupId, String type, String actorName,
                             String targetName, String detail, int coins) {
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
