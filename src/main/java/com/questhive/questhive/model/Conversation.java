package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "conversations")
public class Conversation {
    @Id
    private String id;
    private String groupId;
    private List<String> participantIds; // always exactly 2, stored sorted for stable lookup
    private String contextTaskId; // optional — set when opened via a TaskCard "Message" button
    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;
    private String lastMessagePreview;

    public Conversation() {
        this.createdAt = LocalDateTime.now();
        this.lastMessageAt = LocalDateTime.now();
    }
}
