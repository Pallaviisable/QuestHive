package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "rewards")
public class Reward {

    @Id
    private String id;

    private String userId;
    private String groupId;
    private String taskId;
    private int coinsEarned;
    private int bonusCoins;
    private RewardType type;
    private String description;
    private LocalDateTime earnedAt;

    public enum RewardType {
        TASK_COMPLETION,
        BONUS,
        STREAK_BONUS,
        QUEST_MASTER
    }

    public Reward() {
        this.earnedAt = LocalDateTime.now();
        this.bonusCoins = 0;
    }
}