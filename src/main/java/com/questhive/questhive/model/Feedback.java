package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "feedback")
public class Feedback {
    @Id
    private String id;
    private String userId;
    private String username;
    private String type;
    private String message;
    private String status;
    private LocalDateTime createdAt;

    public Feedback() {
        this.status = "OPEN";
        this.createdAt = LocalDateTime.now();
    }
}
