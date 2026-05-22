package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "invites")
public class Invite {
    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    private String email;
    private String groupId;        // null for ADMIN type invites
    private String invitedByUserId;
    private String type;           // MEMBER or ADMIN
    private boolean used;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

    public Invite() {
        this.used = false;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusHours(48);
    }
}