package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "admin_requests")
public class AdminRequest {
    @Id
    private String id;
    private String fullName;
    private String email;
    private String reason;
    private String status; // PENDING, APPROVED, REJECTED

    private LocalDateTime createdAt;

    public AdminRequest() {
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
    }
}