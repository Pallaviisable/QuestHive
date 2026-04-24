package com.questhive.questhive.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "locations")
public class Location {

    @Id
    private String id;

    private String userId;
    private double latitude;
    private double longitude;
    private String address;
    private LocalDateTime updatedAt;

    public Location() {
        this.updatedAt = LocalDateTime.now();
    }
}