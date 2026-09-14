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
import java.time.LocalDate;
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
    private final NotificationService notificationService;

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
        LocalDate today = now.toLocalDate();

        // Planned pause: streak neither breaks nor grows while paused
        if (user.getPlannedPauseUntil() != null && now.isBefore(user.getPlannedPauseUntil())) {
            user.setLastTaskCompletedAt(now);
            userRepository.save(user);
            return;
        }

        LocalDate lastCredit = user.getLastStreakCreditDate();
        if (lastCredit != null && lastCredit.equals(today)) {
            // Already credited today — nothing to do
            user.setLastTaskCompletedAt(now);
            userRepository.save(user);
            return;
        }

        if (lastCredit != null && lastCredit.equals(today.minusDays(1))) {
            user.setStreak(user.getStreak() + 1);
        } else {
            // Streak broke (or this is the first-ever completion)
            if (user.getStreak() > 0) {
                user.setLastBrokenStreak(user.getStreak());
                user.setStreakBrokenDate(today);
            }
            user.setStreak(1);
        }
        user.setLastStreakCreditDate(today);
        user.setLastTaskCompletedAt(now);

        if (user.getStreak() % 3 == 0) {
            int streakBonus = 5;
            saveReward(userId, task.getGroupId(), task.getId(), streakBonus,
                    RewardType.STREAK_BONUS, user.getStreak() + "-day streak bonus!");
            addCoinsToUser(userId, streakBonus);
        }
        userRepository.save(user);
    }

    private static final int STREAK_RESTORE_COST = 30;

    public Map<String, Object> getStreakStatus(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        LocalDate today = LocalDate.now();
        boolean canRestore = user.getLastBrokenStreak() > 0
                && user.getStreakBrokenDate() != null
                && user.getStreakBrokenDate().equals(today);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("streak", user.getStreak());
        result.put("freezeTokens", user.getFreezeTokens());
        result.put("plannedPauseUntil", user.getPlannedPauseUntil());
        result.put("canRestore", canRestore);
        result.put("lastBrokenStreak", user.getLastBrokenStreak());
        result.put("restoreCost", STREAK_RESTORE_COST);
        return result;
    }

    public void restoreStreak(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        LocalDate today = LocalDate.now();
        if (user.getLastBrokenStreak() <= 0 || user.getStreakBrokenDate() == null
                || !user.getStreakBrokenDate().equals(today)) {
            throw new RuntimeException("No broken streak to restore. You can only restore on the day your streak broke.");
        }
        if (user.getCoins() < STREAK_RESTORE_COST) {
            throw new RuntimeException("Not enough coins to restore your streak (" + STREAK_RESTORE_COST + " required).");
        }
        user.setCoins(user.getCoins() - STREAK_RESTORE_COST);
        user.setStreak(user.getLastBrokenStreak());
        user.setLastStreakCreditDate(today);
        user.setLastBrokenStreak(0);
        user.setStreakBrokenDate(null);
        userRepository.save(user);
    }

    public void planStreakPause(String userId, int days) {
        if (days < 1 || days > 7) {
            throw new RuntimeException("Planned pause must be between 1 and 7 days.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (user.getPlannedPauseUntil() != null && LocalDateTime.now().isBefore(user.getPlannedPauseUntil())) {
            throw new RuntimeException("You already have a planned pause active.");
        }
        user.setPlannedPauseUntil(LocalDateTime.now().plusDays(days));
        userRepository.save(user);
    }

    // Called by the nightly scheduler — auto-consumes a freeze token or sends a risk notification
    public void checkStreakRisk(User user) {
        if (user.getStreak() <= 0) return;
        LocalDateTime now = LocalDateTime.now();
        if (user.getPlannedPauseUntil() != null && now.isBefore(user.getPlannedPauseUntil())) return;
        LocalDate today = now.toLocalDate();
        if (user.getLastStreakCreditDate() != null && user.getLastStreakCreditDate().equals(today)) return;

        if (user.getFreezeTokens() > 0) {
            user.setFreezeTokens(user.getFreezeTokens() - 1);
            user.setLastStreakCreditDate(today);
            userRepository.save(user);
            notificationService.sendNotification(user.getId(), "🧊 Streak Protected!",
                    "A freeze token was used to protect your " + user.getStreak() + "-day streak.",
                    "STREAK_FROZEN", null, null);
        } else {
            notificationService.sendNotification(user.getId(), "⚠️ Streak at Risk!",
                    "Complete a task before midnight to keep your " + user.getStreak() + "-day streak alive.",
                    "STREAK_RISK", null, null);
        }
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