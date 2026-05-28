package com.questhive.questhive.service;

import com.questhive.questhive.model.User;
import com.questhive.questhive.model.Task;
import com.questhive.questhive.repository.UserRepository;
import com.questhive.questhive.repository.TaskRepository;
import com.questhive.questhive.repository.XpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final XpRepository xpRepository;

    public Map<String, Object> getPlatformAnalytics() {
        List<User> allUsers = userRepository.findAll();
        List<Task> allTasks = taskRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekAgo = now.minusDays(7);
        LocalDateTime monthAgo = now.minusDays(30);

        // User stats
        long totalUsers = allUsers.size();
        long activeUsers = allUsers.stream()
                .filter(u -> "ACTIVE".equals(u.getStatus()))
                .count();
        long newUsersThisWeek = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(weekAgo))
                .count();
        long deactivatedUsers = allUsers.stream()
                .filter(u -> "DEACTIVATED".equals(u.getStatus()))
                .count();

        // Task stats
        long totalTasks = allTasks.size();
        long completedTasks = allTasks.stream()
                .filter(t -> t.getStatus() == Task.Status.COMPLETED)
                .count();
        long deniedTasks = allTasks.stream()
                .filter(t -> t.getStatus() == Task.Status.DENIED)
                .count();
        long overdueTasks = allTasks.stream()
                .filter(t -> t.getStatus() != Task.Status.COMPLETED
                        && t.getDeadline() != null
                        && t.getDeadline().isBefore(now))
                .count();
        long tasksThisWeek = allTasks.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().isAfter(weekAgo))
                .count();

        // Completion rate
        double completionRate = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0;

        // Top active users by completed tasks
        Map<String, Long> completedByUser = allTasks.stream()
                .filter(t -> t.getStatus() == Task.Status.COMPLETED && t.getAssignedToId() != null)
                .collect(Collectors.groupingBy(Task::getAssignedToId, Collectors.counting()));

        List<Map<String, Object>> topUsers = completedByUser.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("userId", e.getKey());
                    userRepository.findById(e.getKey()).ifPresent(u ->
                            m.put("name", u.getFullName() != null ? u.getFullName() : u.getUsername()));
                    m.put("completedTasks", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());

        // Task category breakdown
        Map<String, Long> categoryBreakdown = allTasks.stream()
                .filter(t -> t.getCategory() != null)
                .collect(Collectors.groupingBy(t -> t.getCategory().name(), Collectors.counting()));

        // Priority breakdown
        Map<String, Long> priorityBreakdown = allTasks.stream()
                .filter(t -> t.getPriority() != null)
                .collect(Collectors.groupingBy(t -> t.getPriority().name(), Collectors.counting()));

        // Daily task completion for last 7 days
        List<Map<String, Object>> dailyActivity = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = now.minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            long count = allTasks.stream()
                    .filter(t -> t.getStatus() == Task.Status.COMPLETED
                            && t.getCompletedAt() != null
                            && t.getCompletedAt().isAfter(dayStart)
                            && t.getCompletedAt().isBefore(dayEnd))
                    .count();
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", dayStart.toLocalDate().toString());
            day.put("completed", count);
            dailyActivity.add(day);
        }

        // User journey drop-off — where do users get stuck
        long usersWithNoTasks = allUsers.stream()
                .filter(u -> "ACTIVE".equals(u.getStatus()))
                .filter(u -> allTasks.stream().noneMatch(t ->
                        u.getId() != null && u.getId().equals(t.getAssignedToId())))
                .count();
        long usersWithNoCompletedTasks = allUsers.stream()
                .filter(u -> "ACTIVE".equals(u.getStatus()))
                .filter(u -> allTasks.stream().noneMatch(t ->
                        t.getStatus() == Task.Status.COMPLETED &&
                        u.getId() != null && u.getId().equals(t.getAssignedToId())))
                .count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers", totalUsers);
        result.put("activeUsers", activeUsers);
        result.put("deactivatedUsers", deactivatedUsers);
        result.put("newUsersThisWeek", newUsersThisWeek);
        result.put("totalTasks", totalTasks);
        result.put("completedTasks", completedTasks);
        result.put("deniedTasks", deniedTasks);
        result.put("overdueTasks", overdueTasks);
        result.put("tasksCreatedThisWeek", tasksThisWeek);
        result.put("completionRatePercent", Math.round(completionRate));
        result.put("topActiveUsers", topUsers);
        result.put("categoryBreakdown", categoryBreakdown);
        result.put("priorityBreakdown", priorityBreakdown);
        result.put("dailyActivity", dailyActivity);
        result.put("dropOff", Map.of(
                "usersWithNoTasksAssigned", usersWithNoTasks,
                "usersWithZeroCompletions", usersWithNoCompletedTasks
        ));
        return result;
    }
}
