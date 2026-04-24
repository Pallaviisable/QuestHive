package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

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

    public enum Priority { LOW, MEDIUM, HIGH }

    public enum Status { PENDING, IN_PROGRESS, COMPLETED, DENIED }

    public enum Category { GROCERIES, HOME, SCHOOL, PERSONAL, WORK, OTHER }

    public Task() {
        this.status = Status.PENDING;
        this.createdAt = LocalDateTime.now();
    }
}