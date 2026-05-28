package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "tasks")
public class Task {

    @Id
    private String id;
    private String title;
    private String description;
    private String groupId;
    private String assignedById;
    private String assignedToId;
    private Priority priority;
    private Status status;
    private Category category;
    private LocalDateTime deadline;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private boolean isPersonal;
    private int coinsReward;
    private LocalDateTime openTaskNotifiedAt;
    private boolean openTaskBonus = false;

    // Subtasks
    private List<Subtask> subtasks = new ArrayList<>();

    // Comments
    private List<TaskComment> comments = new ArrayList<>();

    // Peer review on high bonus coins
    private boolean pendingPeerReview = false;
    private int bonusCoinsAmount = 0;
    private LocalDateTime peerReviewDeadline;
    private List<String> bonusFlaggedByUserIds = new ArrayList<>();
    private boolean bonusDisputed = false;

    // Commitment pledge
    private String pledgeMessage;
    private LocalDateTime pledgedAt;
    private String pledgedByUserId;

    public enum Priority { LOW, MEDIUM, HIGH }
    public enum Status { PENDING, IN_PROGRESS, COMPLETED, DENIED }
    public enum Category { GROCERIES, HOME, SCHOOL, PERSONAL, WORK, OTHER }

    @Data
    public static class Subtask {
        private String id;
        private String title;
        private boolean completed;
        private LocalDateTime completedAt;
    }

    @Data
    public static class TaskComment {
        private String id;
        private String userId;
        private String authorName;
        private String content;
        private LocalDateTime createdAt;
    }

    public Task() {
        this.status = Status.PENDING;
        this.createdAt = LocalDateTime.now();
    }
}
