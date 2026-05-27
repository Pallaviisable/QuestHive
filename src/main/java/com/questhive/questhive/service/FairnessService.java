package com.questhive.questhive.service;

import com.questhive.questhive.model.FairnessReport;
import com.questhive.questhive.model.Group;
import com.questhive.questhive.model.Task;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.RewardRepository;
import com.questhive.questhive.repository.TaskRepository;
import com.questhive.questhive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FairnessService {

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
}
