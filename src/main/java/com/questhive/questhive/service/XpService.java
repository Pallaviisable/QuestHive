package com.questhive.questhive.service;

import com.questhive.questhive.model.XpRecord;
import com.questhive.questhive.repository.XpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class XpService {

    private final XpRepository xpRepository;

    public void awardXp(String userId, String groupId, int amount, String reason) {
        XpRecord record = new XpRecord();
        record.setUserId(userId);
        record.setGroupId(groupId);
        record.setXpAmount(amount);
        record.setReason(reason);
        xpRepository.save(record);
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
        result.put("xpForNextLevel", xpForNext);
        result.put("xpIntoCurrentLevel", xpIntoLevel);
        result.put("progressPercent", xpForNext > 0 ? (int)((xpIntoLevel * 100.0) / xpForNext) : 100);
        result.put("records", records);
        return result;
    }

    public int calculateLevel(int totalXp) {
        int level = 1;
        while (totalXp >= xpForLevel(level + 1)) level++;
        return level;
    }

    private int xpForLevel(int level) {
        // 0, 100, 250, 450, 700, 1000 ...
        if (level <= 1) return 0;
        return (int)(100 * (level - 1) + 50 * (level - 1) * (level - 2));
    }

    private int xpForNextLevel(int level) {
        return xpForLevel(level + 1) - xpForLevel(level);
    }

    public String getTitle(int level) {
        if (level >= 20) return "Legendary Hive Master 🌟";
        if (level >= 15) return "Grand Quest Champion 🏆";
        if (level >= 10) return "Elite Bee 🐝";
        if (level >= 7)  return "Quest Veteran ⚔️";
        if (level >= 5)  return "Dedicated Worker 💪";
        if (level >= 3)  return "Rising Bee 🌱";
        return "Hive Newcomer 🥚";
    }
}
