package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "group_activities")
public class GroupActivity {
    @Id
    private String id;
    private String groupId;
    private String type; // TASK_ASSIGNED, TASK_COMPLETED, TASK_DENIED, TASK_CLAIMED, REWARD_REDEEMED, MEMBER_JOINED, MEMBER_LEFT, MEMBER_REMOVED, OPEN_TASK_REMINDER, OPEN_TASK_PENALTY
    private String actorName;
    private String targetName;
    private String detail;
    private int coins;
    private LocalDateTime createdAt;

    public GroupActivity() {
        this.createdAt = LocalDateTime.now();
    }
}