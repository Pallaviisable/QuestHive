package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    @Indexed(unique = true)
    private String email;

    private String password;
    private String fullName;
    private String avatarColor;
    private String avatarFrame = "NONE";
    private String titleBadge = "Hive Newcomer";
    private int coins;
    private int streak;
    private boolean isVerified = false;
    private boolean usernameChanged = false;
    private boolean reminderSent = false;
    private LocalDateTime lastTaskCompletedAt;
    private LocalDateTime createdAt;
    private String otpCode;
    private LocalDateTime otpExpiry;
    private String pendingEmail;

    private String role = "MEMBER";
    private String status = "ACTIVE";
    private boolean hasSeenTour = false;

    @Indexed(unique = true)
    private String inviteCode;

    public User() {
        this.coins = 0;
        this.streak = 0;
        this.createdAt = LocalDateTime.now();
        this.avatarColor = "#4CAF50";
        this.isVerified = false;
        this.role = "MEMBER";
        this.status = "ACTIVE";
        this.hasSeenTour = false;
        this.reminderSent = false;
    }
}
