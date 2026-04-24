package com.questhive.questhive.controller;

import com.questhive.questhive.model.Location;
import com.questhive.questhive.service.LocationService;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;
    private final JwtUtil jwtUtil;

    private String extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtUtil.extractUserId(token);
    }
    @PostMapping("/update")
    public ResponseEntity<Location> updateLocation(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, Object> body) {
        String userId = extractUserId(auth);

        // Safe conversion — handles both Integer and Double from JSON
        double latitude = ((Number) body.get("latitude")).doubleValue();
        double longitude = ((Number) body.get("longitude")).doubleValue();
        String address = body.getOrDefault("address", "").toString();

        return ResponseEntity.ok(locationService.updateLocation(userId, latitude, longitude, address));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Location>> groupLocations(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        String userId = extractUserId(auth);
        return ResponseEntity.ok(locationService.getGroupMemberLocations(userId, groupId));
    }

    @GetMapping("/me")
    public ResponseEntity<Location> myLocation(
            @RequestHeader("Authorization") String auth) {
        String userId = extractUserId(auth);
        return ResponseEntity.ok(locationService.getUserLocation(userId));
    }
}