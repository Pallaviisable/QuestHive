package com.questhive.questhive.service;

import com.questhive.questhive.model.Group;
import com.questhive.questhive.model.User;
import com.questhive.questhive.model.Task;
import com.questhive.questhive.repository.GroupRepository;
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
    private final GroupRepository groupRepository;
    private final XpRepository xpRepository;

    public Map<String, Object> getPlatformAnalytics() {
        List<User>  allUsers  = userRepository.findAll();
        List<Task>  allTasks  = taskRepository.findAll();
        List<Group> allGroups = groupRepository.findAll();

        LocalDateTime now           = LocalDateTime.now();
        LocalDateTime weekAgo       = now.minusDays(7);
        LocalDateTime twoWeeksAgo   = now.minusDays(14);
        LocalDateTime fifteenDaysAgo = now.minusDays(15);

        // ── Users ────────────────────────────────────────────────
        long totalUsers       = allUsers.size();
        long activeUsers      = allUsers.stream().filter(u -> "ACTIVE".equals(u.getStatus())).count();
        long deactivatedUsers = allUsers.stream().filter(u -> "DEACTIVATED".equals(u.getStatus())).count();
        long newUsersThisWeek = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(weekAgo)).count();

        // Retention — users who completed a task this week vs last week
        Set<String> activeThisWeek = allTasks.stream()
                .filter(t -> t.getStatus() == Task.Status.COMPLETED
                        && t.getCompletedAt() != null
                        && t.getCompletedAt().isAfter(weekAgo)
                        && t.getAssignedToId() != null)
                .map(Task::getAssignedToId).collect(Collectors.toSet());

        Set<String> activeLastWeek = allTasks.stream()
                .filter(t -> t.getStatus() == Task.Status.COMPLETED
                        && t.getCompletedAt() != null
                        && t.getCompletedAt().isAfter(twoWeeksAgo)
                        && t.getCompletedAt().isBefore(weekAgo)
                        && t.getAssignedToId() != null)
                .map(Task::getAssignedToId).collect(Collectors.toSet());

        long retainedUsers  = activeLastWeek.isEmpty() ? 0
                : activeLastWeek.stream().filter(activeThisWeek::contains).count();
        long retentionRate  = activeLastWeek.isEmpty() ? 0
                : Math.round(retainedUsers * 100.0 / activeLastWeek.size());

        // Dormant: ACTIVE, account older than 7 days, no completion this week
        long dormantUsers = allUsers.stream()
                .filter(u -> "ACTIVE".equals(u.getStatus()))
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isBefore(weekAgo))
                .filter(u -> !activeThisWeek.contains(u.getId()))
                .count();

        // ── Tasks ────────────────────────────────────────────────
        long totalTasks           = allTasks.size();
        long completedTasks       = allTasks.stream().filter(t -> t.getStatus() == Task.Status.COMPLETED).count();
        long deniedTasks          = allTasks.stream().filter(t -> t.getStatus() == Task.Status.DENIED).count();
        long overdueTasks         = allTasks.stream()
                .filter(t -> t.getStatus() != Task.Status.COMPLETED
                        && t.getDeadline() != null && t.getDeadline().isBefore(now)).count();
        long tasksCreatedThisWeek = allTasks.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().isAfter(weekAgo)).count();
        double completionRate     = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0;

        // ── Groups ───────────────────────────────────────────────
        long totalGroups    = allGroups.size();
        long activeGroups   = allGroups.stream()
                .filter(g -> g.getLastActivityAt() == null
                        || g.getLastActivityAt().isAfter(fifteenDaysAgo)).count();
        long inactiveGroups = totalGroups - activeGroups;

        // ── Admins ───────────────────────────────────────────────
        long totalAdmins = allUsers.stream()
                .filter(u -> "FAMILY_ADMIN".equals(u.getRole())).count();

        Set<String> adminIds = allUsers.stream()
                .filter(u -> "FAMILY_ADMIN".equals(u.getRole()))
                .map(User::getId).collect(Collectors.toSet());

        long activeAdminsThisWeek = allTasks.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().isAfter(weekAgo)
                        && t.getAssignedById() != null && adminIds.contains(t.getAssignedById()))
                .map(Task::getAssignedById).distinct().count();

        // ── Top users ────────────────────────────────────────────
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
                }).collect(Collectors.toList());

        // ── Breakdowns ───────────────────────────────────────────
        Map<String, Long> categoryBreakdown = allTasks.stream()
                .filter(t -> t.getCategory() != null)
                .collect(Collectors.groupingBy(t -> t.getCategory().name(), Collectors.counting()));

        Map<String, Long> priorityBreakdown = allTasks.stream()
                .filter(t -> t.getPriority() != null)
                .collect(Collectors.groupingBy(t -> t.getPriority().name(), Collectors.counting()));

        // ── Daily completions (7 days) ───────────────────────────
        List<Map<String, Object>> dailyActivity = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = now.minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime dayEnd   = dayStart.plusDays(1);
            long count = allTasks.stream()
                    .filter(t -> t.getStatus() == Task.Status.COMPLETED
                            && t.getCompletedAt() != null
                            && t.getCompletedAt().isAfter(dayStart)
                            && t.getCompletedAt().isBefore(dayEnd)).count();
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", dayStart.toLocalDate().toString());
            day.put("completed", count);
            dailyActivity.add(day);
        }

        // ── Drop-off ─────────────────────────────────────────────
        long usersWithNoTasks = allUsers.stream()
                .filter(u -> "ACTIVE".equals(u.getStatus()))
                .filter(u -> allTasks.stream().noneMatch(t ->
                        u.getId() != null && u.getId().equals(t.getAssignedToId()))).count();
        long usersWithZeroCompletions = allUsers.stream()
                .filter(u -> "ACTIVE".equals(u.getStatus()))
                .filter(u -> allTasks.stream().noneMatch(t ->
                        t.getStatus() == Task.Status.COMPLETED
                        && u.getId() != null && u.getId().equals(t.getAssignedToId()))).count();

        // ── Assemble ─────────────────────────────────────────────
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers",          totalUsers);
        result.put("activeUsers",         activeUsers);
        result.put("deactivatedUsers",    deactivatedUsers);
        result.put("newUsersThisWeek",    newUsersThisWeek);
        result.put("activeUsersThisWeek", activeThisWeek.size());
        result.put("activeUsersLastWeek", activeLastWeek.size());
        result.put("retentionRatePercent", retentionRate);
        result.put("dormantUsers",        dormantUsers);
        result.put("totalTasks",          totalTasks);
        result.put("completedTasks",      completedTasks);
        result.put("deniedTasks",         deniedTasks);
        result.put("overdueTasks",        overdueTasks);
        result.put("tasksCreatedThisWeek", tasksCreatedThisWeek);
        result.put("completionRatePercent", Math.round(completionRate));
        result.put("totalGroups",         totalGroups);
        result.put("activeGroups",        activeGroups);
        result.put("inactiveGroups",      inactiveGroups);
        result.put("groupsDeletedThisMonth", 0L);
        result.put("totalAdmins",         totalAdmins);
        result.put("activeAdminsThisWeek", activeAdminsThisWeek);
        result.put("totalRedemptions",    0L);
        result.put("totalMessages",       0L);
        result.put("topActiveUsers",      topUsers);
        result.put("categoryBreakdown",   categoryBreakdown);
        result.put("priorityBreakdown",   priorityBreakdown);
        result.put("dailyActivity",       dailyActivity);
        result.put("dropOff", Map.of(
                "usersWithNoTasksAssigned",  usersWithNoTasks,
                "usersWithZeroCompletions",  usersWithZeroCompletions
        ));
        return result;
    }
}
