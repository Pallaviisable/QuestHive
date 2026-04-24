package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "redeem_options")
public class RedeemOption {

    @Id
    private String id;

    private String groupId;
    private String title;
    private String description;
    private int coinsRequired;
    private boolean isActive;
    private LocalDateTime createdAt;

    public RedeemOption() {
        this.isActive = true;
        this.createdAt = LocalDateTime.now();
    }
}