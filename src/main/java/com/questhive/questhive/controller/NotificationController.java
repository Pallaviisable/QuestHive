package com.questhive.questhive.controller;

import com.questhive.questhive.model.Notification;
import com.questhive.questhive.service.NotificationService;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@RequestHeader("Authorization") String auth) {
        String userId = jwtUtil.extractUserId(auth.replace("Bearer ", ""));
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@RequestHeader("Authorization") String auth) {
        String userId = jwtUtil.extractUserId(auth.replace("Bearer ", ""));
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(@RequestHeader("Authorization") String auth) {
        String userId = jwtUtil.extractUserId(auth.replace("Bearer ", ""));
        notificationService.markAllRead(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable String id) {
        notificationService.markRead(id);
        return ResponseEntity.ok().build();
    }
}
