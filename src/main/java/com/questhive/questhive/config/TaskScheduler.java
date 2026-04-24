package com.questhive.questhive.config;

import com.questhive.questhive.model.Task;
import com.questhive.questhive.model.Task.Status;
import com.questhive.questhive.model.Task.Category;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.TaskRepository;
import com.questhive.questhive.repository.UserRepository;
import com.questhive.questhive.repository.GroupRepository;
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

    // Runs every 1 hour — deadline reminders
    @Scheduled(fixedRate = 3600000)
    public void sendDeadlineReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in24Hours = now.plusHours(24);

        List<Task> tasks = taskRepository.findAll();

        for (Task task : tasks) {
            if (task.getStatus() == Status.COMPLETED) continue;
            if (task.getDeadline() == null) continue;

            boolean isWithin24Hours =
                    task.getDeadline().isAfter(now) &&
                            task.getDeadline().isBefore(in24Hours);

            if (isWithin24Hours) {
                userRepository.findById(task.getAssignedToId())
                        .ifPresent(user -> emailService.sendDeadlineReminder(
                                user.getEmail(),
                                task.getTitle(),
                                task.getDeadline().toString()
                        ));
            }
        }
    }

    // Runs daily at 8 AM — recurring pattern detection
    @Scheduled(cron = "0 0 8 * * *")
    public void detectRecurringPatterns() {
        List<User> users = userRepository.findAll();

        for (User user : users) {
            for (Category category : Category.values()) {
                if (taskService.hasRecurringPattern(user.getId(), category)) {
                    emailService.sendRecurringTaskSuggestion(
                            user.getEmail(),
                            category.name()
                    );
                }
            }
        }
    }

    // Runs every Monday midnight — weekly reward
    @Scheduled(cron = "0 0 0 * * MON")
    public void awardWeeklyQuestMaster() {
        groupRepository.findAll().forEach(group ->
                rewardService.awardQuestMaster(group.getId())
        );
    }

    // Runs every hour — auto assign old open tasks
    @Scheduled(fixedRate = 3600000)
    public void autoAssignOpenTasks() {
        taskService.processOpenTaskNotifications();
    }

    // Runs every 30 minutes — process open task notifications
    @Scheduled(fixedDelay = 1800000)
    public void processOpenTasks() {
        taskService.processOpenTaskNotifications();
    }
}