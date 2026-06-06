package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String userId;      // who receives it
    private String title;
    private String body;
    private String type;        // TASK_ASSIGNED, TASK_COMPLETED, CHAT_MESSAGE, PLEDGE_MADE, etc
    private String groupId;
    private String taskId;
    private boolean read = false;
    private LocalDateTime createdAt = LocalDateTime.now();
}
