package com.questhive.questhive.service;

import com.questhive.questhive.model.XpRecord;
import com.questhive.questhive.model.User;
import com.questhive.questhive.model.GroupActivity;
import com.questhive.questhive.repository.XpRepository;
import com.questhive.questhive.repository.UserRepository;
import com.questhive.questhive.repository.GroupActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class XpService {

    private final XpRepository xpRepository;
    private final UserRepository userRepository;
    private final GroupActivityRepository groupActivityRepository;
    private final NotificationService notificationService;

    public void awardXp(String userId, String groupId, int amount, String reason) {
        int oldTotalXp = xpRepository.findByUserId(userId).stream()
                .mapToInt(XpRecord::getXpAmount).sum();
        int oldLevel = calculateLevel(oldTotalXp);

        XpRecord record = new XpRecord();
        record.setUserId(userId);
        record.setGroupId(groupId);
        record.setXpAmount(amount);
        record.setReason(reason);
        xpRepository.save(record);

        // Update user's frame and title based on new level
        updateUserFrameAndTitle(userId, groupId);

        // Streak freeze tokens: earned every 3 levels
        int newLevel = calculateLevel(oldTotalXp + amount);
        int tokensEarned = (newLevel / 3) - (oldLevel / 3);
        if (tokensEarned > 0) {
            userRepository.findById(userId).ifPresent(user -> {
                user.setFreezeTokens(user.getFreezeTokens() + tokensEarned);
                userRepository.save(user);
                notificationService.sendNotification(userId, "🧊 Freeze Token Earned!",
                        "You earned " + tokensEarned + " streak freeze token"
                                + (tokensEarned > 1 ? "s" : "") + " for reaching level " + newLevel + "!",
                        "FREEZE_TOKEN_EARNED", groupId, null);
            });
        }
    }

    public Map<String, Object> getUserXpSummary(String userId) {
        List<XpRecord> records = xpRepository.findByUserId(userId);
        int totalXp = records.stream().mapToInt(XpRecord::getXpAmount).sum();
        int level = calculateLevel(totalXp);
        int xpForNext = xpForNextLevel(level);
        int xpIntoLevel = totalXp - xpForLevel(level);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalXp", totalXp);
        result.put("level", level);
        result.put("title", getTitle(level));
        result.put("frame", getAvatarFrame(level));
        result.put("xpForNextLevel", xpForNext);
        result.put("xpIntoCurrentLevel", xpIntoLevel);
        result.put("progressPercent", xpForNext > 0 ? (int)((xpIntoLevel * 100.0) / xpForNext) : 100);
        result.put("records", records);
        return result;
    }

    private void updateUserFrameAndTitle(String userId, String groupId) {
        userRepository.findById(userId).ifPresent(user -> {
            String oldFrame = user.getAvatarFrame();
            List<XpRecord> records = xpRepository.findByUserId(userId);
            int totalXp = records.stream().mapToInt(XpRecord::getXpAmount).sum();
            int level = calculateLevel(totalXp);
            String newFrame = getAvatarFrame(level);
            String newTitle = getTitle(level);
            user.setAvatarFrame(newFrame);
            user.setTitleBadge(newTitle);
            userRepository.save(user);

            // Family-visible recognition: post to the group activity feed whenever the tier changes
            if (groupId != null && !newFrame.equals(oldFrame)) {
                GroupActivity activity = new GroupActivity();
                activity.setGroupId(groupId);
                activity.setType("LEVEL_UP");
                activity.setActorName(user.getFullName());
                activity.setDetail(user.getFullName() + " is now " + newTitle + " of the family!");
                groupActivityRepository.save(activity);
            }
        });
    }

    public int calculateLevel(int totalXp) {
        int level = 1;
        while (totalXp >= xpForLevel(level + 1)) level++;
        return level;
    }

    private int xpForLevel(int level) {
        if (level <= 1) return 0;
        return (int)(100 * (level - 1) + 50 * (level - 1) * (level - 2));
    }

    private int xpForNextLevel(int level) {
        return xpForLevel(level + 1) - xpForLevel(level);
    }

    public String getTitle(int level) {
        if (level >= 20) return "Backbone of the Family 🌟";
        if (level >= 15) return "Pillar of the Family 🏆";
        if (level >= 10) return "Trusted 🐝";
        if (level >= 7)  return "Reliable ⚔️";
        if (level >= 5)  return "Dependable 💪";
        if (level >= 3)  return "Getting Started 🌱";
        return "New to the Family 🥚";
    }

    public String getAvatarFrame(int level) {
        if (level >= 20) return "LEGENDARY";
        if (level >= 15) return "CHAMPION";
        if (level >= 10) return "ELITE";
        if (level >= 7)  return "VETERAN";
        if (level >= 5)  return "DEDICATED";
        if (level >= 3)  return "RISING";
        return "NONE";
    }
}
