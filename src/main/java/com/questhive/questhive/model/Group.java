package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Data
@Document(collection = "groups")
public class Group {

    @Id
    private String id;

    private String name;
    private String description;
    private String adminId;
    private List<String> memberIds;
    private String inviteCode;
    private LocalDateTime createdAt;

    public Group() {
        this.memberIds = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
    }
}