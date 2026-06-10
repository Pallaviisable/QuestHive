package com.questhive.questhive.service;

import com.questhive.questhive.model.FairnessReport;
import com.questhive.questhive.model.Group;
import com.questhive.questhive.model.Task;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.RewardRepository;
import com.questhive.questhive.repository.TaskRepository;
import com.questhive.questhive.repository.UserRepository;
import com.questhive.questhive.repository.NotificationRepository;
import com.questhive.questhive.model.Notification;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FairnessService {
    private final NotificationRepository notificationRepository;

    private final GroupRepository groupRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final RewardRepository rewardRepository;

    public FairnessReport getFairnessReport(String groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        List<Task> completedTasks = taskRepository.findAll().stream()
                .filter(t -> groupId.equals(t.getGroupId()))
                .filter(t -> t.getStatus() == Task.Status.COMPLETED)
                .collect(Collectors.toList());

        Map<String, Integer> taskCount = new HashMap<>();
        Map<String, Integer> coinsMap = new HashMap<>();
        Map<String, String> names = new HashMap<>();

        for (String memberId : group.getMemberIds()) {
            taskCount.put(memberId, 0);
            coinsMap.put(memberId, 0);
            userRepository.findById(memberId).ifPresent(u ->
                names.put(memberId, u.getFullName() != null ? u.getFullName() : u.getUsername())
            );
        }

        for (Task task : completedTasks) {
            if (task.getAssignedToId() != null && taskCount.containsKey(task.getAssignedToId())) {
                taskCount.merge(task.getAssignedToId(), 1, Integer::sum);
                coinsMap.merge(task.getAssignedToId(), task.getCoinsReward(), Integer::sum);
            }
        }

        // Fairness calculation
        List<Integer> counts = new ArrayList<>(taskCount.values());
        int max = counts.stream().mapToInt(i -> i).max().orElse(0);
        int min = counts.stream().mapToInt(i -> i).min().orElse(0);
        int diff = max - min;

        String status;
        String suggestion;
        if (diff <= 1) {
            status = "FAIR";
            suggestion = "Great balance! Tasks are evenly distributed.";
        } else if (diff <= 3) {
            status = "SLIGHTLY_UNEVEN";
            String underloaded = names.entrySet().stream()
                    .filter(e -> taskCount.get(e.getKey()) == min)
                    .map(Map.Entry::getValue).findFirst().orElse("a member");
            suggestion = "Consider assigning more tasks to " + underloaded + ".";
        } else {
            status = "UNEVEN";
            String overloaded = names.entrySet().stream()
                    .filter(e -> taskCount.get(e.getKey()) == max)
                    .map(Map.Entry::getValue).findFirst().orElse("a member");
            suggestion = overloaded + " is carrying too much. Redistribute tasks for better balance.";
        }

        FairnessReport report = new FairnessReport();
        report.setGroupId(groupId);
        report.setTaskCountPerMember(taskCount);
        report.setCoinsPerMember(coinsMap);
        report.setMemberNames(names);
        report.setFairnessStatus(status);
        report.setSuggestion(suggestion);
        return report;
    }


    public Map<String, Object> getConcentrationReport(String groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        List<Task> recentTasks = taskRepository.findAll().stream()
                .filter(t -> groupId.equals(t.getGroupId()))
                .filter(t -> t.getCreatedAt() != null &&
                        t.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusDays(14)))
                .collect(java.util.stream.Collectors.toList());

        // assignerId -> assigneeId -> count
        Map<String, Map<String, Integer>> matrix = new HashMap<>();
        for (Task task : recentTasks) {
            if (task.getAssignedById() == null || task.getAssignedToId() == null) continue;
            matrix.computeIfAbsent(task.getAssignedById(), k -> new HashMap<>())
                  .merge(task.getAssignedToId(), 1, Integer::sum);
        }

        List<String> alerts = new java.util.ArrayList<>();
        Map<String, String> names = new HashMap<>();
        for (String memberId : group.getMemberIds()) {
            userRepository.findById(memberId).ifPresent(u ->
                names.put(memberId, u.getFullName() != null ? u.getFullName() : u.getUsername()));
        }

        // Check 70% concentration rule
        for (Map.Entry<String, Map<String, Integer>> adminEntry : matrix.entrySet()) {
            String adminId = adminEntry.getKey();
            Map<String, Integer> assignments = adminEntry.getValue();
            int total = assignments.values().stream().mapToInt(i -> i).sum();
            for (Map.Entry<String, Integer> assigneeEntry : assignments.entrySet()) {
                double pct = total > 0 ? (assigneeEntry.getValue() * 100.0 / total) : 0;
                if (pct >= 70) {
                    String adminName = names.getOrDefault(adminId, "Admin");
                    String assigneeName = names.getOrDefault(assigneeEntry.getKey(), "Member");
                    alerts.add("⚠️ " + adminName + " assigned " + String.format("%.0f", pct) +
                            "% of tasks to " + assigneeName + " in the last 14 days.");
                }
            }
        }

        // Bonus coin disparity detection
        Map<String, Integer> bonusCoinsPerMember = new HashMap<>();
        for (Task task : recentTasks) {
            if (task.getAssignedToId() == null) continue;
            bonusCoinsPerMember.merge(task.getAssignedToId(), task.getCoinsReward(), Integer::sum);
        }
        if (!bonusCoinsPerMember.isEmpty()) {
            double avg = bonusCoinsPerMember.values().stream().mapToInt(i -> i).average().orElse(0);
            for (Map.Entry<String, Integer> e : bonusCoinsPerMember.entrySet()) {
                if (e.getValue() > avg * 1.5 && avg > 0) {
                    String memberName = names.getOrDefault(e.getKey(), "Member");
                    alerts.add("🪙 " + memberName + " received significantly above-average coins (" +
                            e.getValue() + " vs avg " + String.format("%.0f", avg) + ") in 14 days.");
                }
            }
        }

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("alerts", alerts);
        result.put("assignmentMatrix", matrix);
        result.put("memberNames", names);
        result.put("bonusCoinsPerMember", bonusCoinsPerMember);
        result.put("periodDays", 14);
        return result;
    }


    public Map<String, Object> requestBonusReview(String taskId, String requestedByUserId, int bonusCoins) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        int PEER_REVIEW_THRESHOLD = 50;
        Map<String, Object> result = new java.util.LinkedHashMap<>();

        if (bonusCoins >= PEER_REVIEW_THRESHOLD) {
            task.setPendingPeerReview(true);
            task.setBonusCoinsAmount(bonusCoins);
            task.setPeerReviewDeadline(java.time.LocalDateTime.now().plusHours(24));
            taskRepository.save(task);
            result.put("peerReviewRequired", true);
            result.put("message", "Bonus of " + bonusCoins + " coins requires 24-hour peer review window.");
            result.put("deadline", task.getPeerReviewDeadline());
        } else {
            result.put("peerReviewRequired", false);
            result.put("message", "Bonus approved — below peer review threshold.");
        }
        return result;
    }

    public Map<String, Object> flagBonus(String taskId, String flaggedByUserId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.isPendingPeerReview()) {
            return Map.of("success", false, "message", "This task is not under peer review.");
        }
        if (task.getPeerReviewDeadline() != null &&
                java.time.LocalDateTime.now().isAfter(task.getPeerReviewDeadline())) {
            return Map.of("success", false, "message", "Peer review window has expired.");
        }
        if (!task.getBonusFlaggedByUserIds().contains(flaggedByUserId)) {
            task.getBonusFlaggedByUserIds().add(flaggedByUserId);
        }
        int flagCount = task.getBonusFlaggedByUserIds().size();

        // If 3+ flags → reopen task + notify all group members + admin
        if (flagCount >= 3) {
            task.setBonusDisputed(true);
            task.setPendingPeerReview(false);
            task.setStatus(com.questhive.questhive.model.Task.Status.PENDING);

            // Notify all group members
            List<String> memberIds = groupRepository.findById(task.getGroupId())
                    .map(com.questhive.questhive.model.Group::getMemberIds)
                    .orElse(java.util.Collections.emptyList());
            List<com.questhive.questhive.model.User> groupMembers =
                userRepository.findAllById(memberIds);
            for (com.questhive.questhive.model.User member : groupMembers) {
                com.questhive.questhive.model.Notification notif = new com.questhive.questhive.model.Notification();
                notif.setUserId(member.getId());
                notif.setTitle("⚠️ Bonus Disputed");
                notif.setBody("Task \"" + task.getTitle() + "\" was flagged 3 times for unfair bonus and has been reopened.");
                notif.setType("BONUS_DISPUTED");
                notif.setRead(false);
                notif.setCreatedAt(java.time.LocalDateTime.now());
                notificationRepository.save(notif);
            }
        }

        taskRepository.save(task);
        return Map.of("success", true, "flags", flagCount,
                "disputed", task.isBonusDisputed(),
                "message", task.isBonusDisputed() ?
                        "Task flagged 3 times — reopened and all members notified." :
                        "Flag recorded. " + flagCount + " flag(s) so far.");
    }

    public Map<String, Object> getReviewStatus(String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("pendingPeerReview", task.isPendingPeerReview());
        result.put("bonusCoinsAmount", task.getBonusCoinsAmount());
        result.put("peerReviewDeadline", task.getPeerReviewDeadline());
        result.put("flagCount", task.getBonusFlaggedByUserIds().size());
        result.put("disputed", task.isBonusDisputed());
        return result;
    }
}
