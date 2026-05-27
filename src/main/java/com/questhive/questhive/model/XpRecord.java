package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "xp_records")
public class XpRecord {
    @Id
    private String id;
    private String userId;
    private String groupId;
    private int xpAmount;
    private String reason;
    private LocalDateTime earnedAt;

    public XpRecord() {
        this.earnedAt = LocalDateTime.now();
    }
}
