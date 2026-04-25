package com.questhive.questhive.service;

import com.questhive.questhive.model.GroupActivity;
import com.questhive.questhive.model.Reward;
import com.questhive.questhive.model.Reward.RewardType;
import com.questhive.questhive.model.RedeemOption;
import com.questhive.questhive.model.Task;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.GroupActivityRepository;
import com.questhive.questhive.repository.RewardRepository;
import com.questhive.questhive.repository.RedeemOptionRepository;
import com.questhive.questhive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RewardService {

    private final RewardRepository rewardRepository;
    private final RedeemOptionRepository redeemOptionRepository;
    private final UserRepository userRepository;
    private final GroupActivityRepository groupActivityRepository; // ← NEW

    public void handleTaskCompletion(String userId, Task task) {
        int coinsEarned = task.getCoinsReward();
        saveReward(userId, task.getGroupId(), task.getId(), coinsEarned,
                RewardType.TASK_COMPLETION, "Completed task: " + task.getTitle());
        addCoinsToUser(userId, coinsEarned);
        handleStreak(userId, task);
    }

    private void handleStreak(String userId, Task task) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastCompleted = user.getLastTaskCompletedAt();
        boolean completedYesterday = lastCompleted != null &&
                lastCompleted.toLocalDate().equals(now.toLocalDate().minusDays(1));
        boolean completedToday = lastCompleted != null &&
                lastCompleted.toLocalDate().equals(now.toLocalDate());
        if (completedToday) return;
        if (completedYesterday) user.setStreak(user.getStreak() + 1);
        else user.setStreak(1);
        user.setLastTaskCompletedAt(now);
        if (user.getStreak() % 3 == 0) {
            int streakBonus = 5;
            saveReward(userId, task.getGroupId(), task.getId(), streakBonus,
                    RewardType.STREAK_BONUS, user.getStreak() + "-day streak bonus!");
            addCoinsToUser(userId, streakBonus);
        }
        userRepository.save(user);
    }

    public Map<String, Integer> getWeeklyLeaderboard(String groupId) {
        LocalDateTime weekStart = LocalDateTime.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .toLocalDate().atStartOfDay();
        List<Reward> weeklyRewards = rewardRepository.findByGroupIdAndEarnedAtAfter(groupId, weekStart);
        Map<String, Integer> totals = new HashMap<>();
        for (Reward reward : weeklyRewards) {
            totals.merge(reward.getUserId(), reward.getCoinsEarned(), Integer::sum);
        }
        return totals.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));
    }

    public void awardQuestMaster(String groupId) {
        Map<String, Integer> leaderboard = getWeeklyLeaderboard(groupId);
        if (leaderboard.isEmpty()) return;
        String topUserId = leaderboard.entrySet().iterator().next().getKey();
        saveReward(topUserId, groupId, null, 0, RewardType.QUEST_MASTER, "Quest Master of the week! 🏆");
    }

    public RedeemOption createRedeemOption(String groupId, String title, String description, int coinsRequired) {
        // ← NEW: minimum 50 coins
        if (coinsRequired < 50) {
            throw new RuntimeException("Minimum coins required for a redeem option is 50.");
        }
        RedeemOption option = new RedeemOption();
        option.setGroupId(groupId);
        option.setTitle(title);
        option.setDescription(description);
        option.setCoinsRequired(coinsRequired);
        option.setActive(true);
        option.setCreatedAt(LocalDateTime.now());
        return redeemOptionRepository.save(option);
    }

    public List<RedeemOption> getActiveRedeemOptions(String groupId) {
        return redeemOptionRepository.findByGroupIdAndIsActive(groupId, true);
    }

    public void deactivateRedeemOption(String optionId) {
        RedeemOption option = redeemOptionRepository.findById(optionId)
                .orElseThrow(() -> new RuntimeException("Redeem option not found."));
        option.setActive(false);
        redeemOptionRepository.save(option);
    }

    public void redeemOption(String userId, String optionId) {
        RedeemOption option = redeemOptionRepository.findById(optionId)
                .orElseThrow(() -> new RuntimeException("Redeem option not found."));
        if (!option.isActive()) throw new RuntimeException("This redeem option is no longer active.");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (user.getCoins() < option.getCoinsRequired()) {
            throw new RuntimeException("Not enough coins to redeem this option.");
        }
        user.setCoins(user.getCoins() - option.getCoinsRequired());
        userRepository.save(user);
        String title = (option.getTitle() != null && !option.getTitle().isBlank())
                ? option.getTitle()
                : "Unknown Option";
        saveReward(userId, option.getGroupId(), null, -option.getCoinsRequired(),
                RewardType.TASK_COMPLETION, "Redeemed: " + title);
        // ← NEW: log activity
        logActivity(option.getGroupId(), "REWARD_REDEEMED", user.getFullName(), null,
                option.getTitle(), option.getCoinsRequired());
    }

    public List<Reward> getRedeemHistory(String groupId) {
        return rewardRepository.findByGroupId(groupId).stream()
                .filter(r -> r.getDescription() != null && r.getDescription().startsWith("Redeemed:"))
                .collect(Collectors.toList());
    }

    public List<Reward> getRewardsForUser(String userId) {
        return rewardRepository.findByUserId(userId);
    }

    public List<Reward> getRewardsForGroup(String groupId) {
        return rewardRepository.findByGroupId(groupId);
    }

    public int getTotalCoins(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        return user.getCoins();
    }

    private void saveReward(String userId, String groupId, String taskId,
                            int coinsEarned, RewardType type, String description) {
        Reward reward = new Reward();
        reward.setUserId(userId);
        reward.setGroupId(groupId);
        reward.setTaskId(taskId);
        reward.setCoinsEarned(coinsEarned);
        reward.setType(type);
        reward.setDescription(description);
        reward.setEarnedAt(LocalDateTime.now());
        rewardRepository.save(reward);
    }

    private void addCoinsToUser(String userId, int coins) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        user.setCoins(user.getCoins() + coins);
        userRepository.save(user);
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