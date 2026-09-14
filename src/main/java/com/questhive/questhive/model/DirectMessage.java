package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "direct_messages")
public class DirectMessage {
    @Id
    private String id;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String content;
    private LocalDateTime sentAt;
    private List<String> readBy = new ArrayList<>();

    public DirectMessage() {
        this.sentAt = LocalDateTime.now();
    }
}
