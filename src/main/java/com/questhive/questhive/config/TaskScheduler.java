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

    @Scheduled(cron = "0 0 0 * * MON")
    public void awardWeeklyQuestMaster() {
        groupRepository.findAll().forEach(g -> rewardService.awardQuestMaster(g.getId()));
    }

    @Scheduled(fixedRate = 3600000)
    public void processOpenTasks() {
        taskService.processOpenTaskNotifications();
    }

    @Scheduled(fixedRate = 3600000)
    public void deleteUnverifiedAccounts() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        userRepository.findByIsVerifiedFalseAndCreatedAtBefore(cutoff).forEach(user -> {
            if (!"SUPER_ADMIN".equals(user.getRole())) {
                userRepository.delete(user);
                System.out.println("🗑️ Auto-deleted unverified: " + user.getEmail());
            }
        });
    }

    // Priority auto-escalation — runs every 30 minutes
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
                        && task.getCreatedAt().isBefore(mediumCutoff)) {
                    task.setPriority(Priority.HIGH);
                    // recalculate coins
                    int bonus = Math.max(0, task.getCoinsReward() - 10);
                    task.setCoinsReward(20 + bonus);
                    changed = true;
                    System.out.println("⬆️ Escalated MEDIUM→HIGH: " + task.getTitle());
                } else if (task.getPriority() == Priority.HIGH
                        && task.getCreatedAt().isBefore(highCutoff)) {
                    // Warn all members + admin
                    groupRepository.findById(task.getGroupId()).ifPresent(group -> {
                        group.getMemberIds().forEach(memberId ->
                            userRepository.findById(memberId).ifPresent(member ->
                                emailService.sendDeadlineReminder(
                                    member.getEmail(),
                                    "⚠️ HIGH priority task unaddressed: " + task.getTitle(),
                                    "12+ hours pending — immediate action needed!"
                                )
                            )
                        );
                    });
                }
                if (changed) taskRepository.save(task);
            });
    }

    // Weekly digest — every Monday at 9 AM
    @Scheduled(cron = "0 0 9 * * MON")
    public void sendWeeklyDigests() {
        groupRepository.findAll().forEach(group -> {
            group.getMemberIds().forEach(memberId ->
                userRepository.findById(memberId).ifPresent(member ->
                    emailService.sendWeeklyDigest(member.getEmail(), member.getFullName(), group.getName())
                )
            );
        });
    }
}
