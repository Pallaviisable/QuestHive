package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "chat_messages")
public class ChatMessage {
    @Id
    private String id;
    private String groupId;
    private String userId;
    private String authorName;
    private String content;
    private String type;
    private LocalDateTime sentAt;

    public ChatMessage() {
        this.sentAt = LocalDateTime.now();
        this.type = "TEXT";
    }
}
