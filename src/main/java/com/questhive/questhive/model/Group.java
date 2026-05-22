package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "groups")
public class Group {
    @Id
    private String id;

    private String name;
    private String description;
    private String adminId;
    private List<String> memberIds;
    private List<String> deactivatedMemberIds; // members blocked from this group
    private String inviteCode;
    private LocalDateTime createdAt;

    // Week 1 additions
    private String template;               // FAMILY or CUSTOM
    private List<String> taskCategories;   // pre-filled by template

    public Group() {
        this.memberIds = new ArrayList<>();
        this.deactivatedMemberIds = new ArrayList<>();
        this.taskCategories = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
    }
}