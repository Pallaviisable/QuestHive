package com.questhive.questhive.config;

import com.questhive.questhive.model.Group;
import com.questhive.questhive.model.Task;
import com.questhive.questhive.model.Task.Status;
import com.questhive.questhive.model.Task.Category;
import com.questhive.questhive.model.Task.Priority;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.TaskRepository;
import com.questhive.questhive.repository.UserRepository;
import com.questhive.questhive.service.EmailService;
import com.questhive.questhive.service.GroupService;
import com.questhive.questhive.service.RewardService;
import com.questhive.questhive.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@EnableScheduling
@RequiredArgsConstructor
public class TaskScheduler {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final EmailService emailService;
    private final RewardService rewardService;
    private final TaskService taskService;
    private final GroupService groupService;

    // ── Deadline reminders — every hour ──────────────────────────────────────
    @Scheduled(fixedRate = 3600000)
    public void sendDeadlineReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in24Hours = now.plusHours(24);
        taskRepository.findAll().stream()
            .filter(t -> t.getStatus() != Status.COMPLETED && t.getDeadline() != null)
            .filter(t -> t.getDeadline().isAfter(now) && t.getDeadline().isBefore(in24Hours))
            .filter(t -> t.getAssignedToId() != null)
            .forEach(t -> userRepository.findById(t.getAssignedToId()).ifPresent(u ->
                emailService.sendDeadlineReminder(u.getEmail(), t.getTitle(), t.getDeadline().toString())));
    }

    // ── Recurring pattern detection — daily 8am ───────────────────────────────
    @Scheduled(cron = "0 0 8 * * *")
    public void detectRecurringPatterns() {
        userRepository.findAll().forEach(user -> {
            for (Category cat : Category.values()) {
                if (taskService.hasRecurringPattern(user.getId(), cat)) {
                    emailService.sendRecurringTaskSuggestion(user.getEmail(), cat.name());
                }
            }
        });
    }

    // ── Quest Master award — Monday midnight ──────────────────────────────────
    @Scheduled(cron = "0 0 0 * * MON")
    public void awardWeeklyQuestMaster() {
        groupRepository.findAll().forEach(g -> rewardService.awardQuestMaster(g.getId()));
    }

    // ── Open task processing — every hour ────────────────────────────────────
    @Scheduled(fixedRate = 3600000)
    public void processOpenTasks() {
        taskService.processOpenTaskNotifications();
    }

    // ── Unverified account cleanup — every hour ───────────────────────────────
    // New Feature #1: send 24h reminder, delete at 48h
    @Scheduled(fixedRate = 3600000)
    public void deleteUnverifiedAccounts() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderCutoff = now.minusHours(24);
        LocalDateTime deleteCutoff = now.minusHours(48);

        userRepository.findAll().stream()
            .filter(u -> !u.isVerified() && !"SUPER_ADMIN".equals(u.getRole()))
            .filter(u -> u.getCreatedAt() != null)
            .forEach(user -> {
                if (user.getCreatedAt().isBefore(deleteCutoff)) {
                    userRepository.delete(user);
                    System.out.println("🗑️ Auto-deleted unverified: " + user.getEmail());
                } else if (user.getCreatedAt().isBefore(reminderCutoff) && !Boolean.TRUE.equals(user.isReminderSent())) {
                    emailService.sendVerificationReminder(user.getEmail(), user.getFullName());
                    user.setReminderSent(true);
                    userRepository.save(user);
                    System.out.println("📧 Verification reminder sent: " + user.getEmail());
                }
            });
    }

    // ── Priority auto-escalation — every 30 minutes ───────────────────────────
    @Scheduled(fixedRate = 1800000)
    public void autoEscalatePriorities() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime mediumCutoff = now.minusHours(24);
        LocalDateTime highCutoff = now.minusHours(12);

        taskRepository.findAll().stream()
            .filter(t -> t.getStatus() == Status.PENDING && t.getGroupId() != null)
            .forEach(task -> {
                boolean changed = false;
                if (task.getPriority() == Priority.MEDIUM
                        && task.getCreatedAt() != null
                        && task.getCreatedAt().isBefore(mediumCutoff)) {
                    task.setPriority(Priority.HIGH);
                    int bonus = Math.max(0, task.getCoinsReward() - 10);
                    task.setCoinsReward(20 + bonus);
                    changed = true;
                    System.out.println("⬆️ Escalated MEDIUM→HIGH: " + task.getTitle());
                } else if (task.getPriority() == Priority.HIGH
                        && task.getCreatedAt() != null
                        && task.getCreatedAt().isBefore(highCutoff)) {
                    groupRepository.findById(task.getGroupId()).ifPresent(group ->
                        group.getMemberIds().forEach(memberId ->
                            userRepository.findById(memberId).ifPresent(member ->
                                emailService.sendDeadlineReminder(
                                    member.getEmail(),
                                    "⚠️ HIGH priority task unaddressed: " + task.getTitle(),
                                    "12+ hours pending — immediate action needed!"
                                )
                            )
                        )
                    );
                }
                if (changed) taskRepository.save(task);
            });
    }

    // ── Weekly digest — Monday 9am ────────────────────────────────────────────
    @Scheduled(cron = "0 0 9 * * MON")
    public void sendWeeklyDigests() {
        groupRepository.findAll().forEach(group ->
            group.getMemberIds().forEach(memberId ->
                userRepository.findById(memberId).ifPresent(member ->
                    emailService.sendWeeklyDigest(member.getEmail(), member.getFullName(), group.getName())
                )
            )
        );
    }

    // ── Group inactivity — every day at midnight ───────────────────────────────
    // New Feature #2: warn at 15 days, delete at 30 days
    @Scheduled(cron = "0 0 0 * * *")
    public void processGroupInactivity() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime warnCutoff = now.minusDays(15);
        LocalDateTime deleteCutoff = now.minusDays(30);

        groupRepository.findAll().forEach(group -> {
            LocalDateTime lastActivity = group.getLastActivityAt() != null
                    ? group.getLastActivityAt()
                    : group.getCreatedAt();

            if (lastActivity == null) return;

            if (lastActivity.isBefore(deleteCutoff)) {
                // Notify all members then delete
                group.getMemberIds().forEach(memberId ->
                    userRepository.findById(memberId).ifPresent(member ->
                        emailService.sendGroupAutoDeleted(
                            member.getEmail(), member.getFullName(), group.getName())
                    )
                );
                groupRepository.delete(group);
                System.out.println("🗑️ Auto-deleted inactive group: " + group.getName());

            } else if (lastActivity.isBefore(warnCutoff)) {
                long daysInactive = java.time.temporal.ChronoUnit.DAYS.between(lastActivity, now);
                group.getMemberIds().forEach(memberId ->
                    userRepository.findById(memberId).ifPresent(member ->
                        emailService.sendGroupInactivityWarning(
                            member.getEmail(), member.getFullName(), group.getName(), (int) daysInactive)
                    )
                );
                System.out.println("⚠️ Inactivity warning sent for group: " + group.getName());
            }
        });
    }
}
