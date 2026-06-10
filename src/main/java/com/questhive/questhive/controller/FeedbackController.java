package com.questhive.questhive.controller;

import com.questhive.questhive.model.Feedback;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.FeedbackRepository;
import com.questhive.questhive.repository.UserRepository;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<?> submitFeedback(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Feedback feedback = new Feedback();
        feedback.setUserId(userId);
        feedback.setUsername(user.getFullName());
        feedback.setType(body.getOrDefault("type", "BUG"));
        feedback.setMessage(body.get("message"));
        feedbackRepository.save(feedback);
        return ResponseEntity.ok(Map.of("message", "Feedback submitted. Thank you!"));
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllFeedback(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (!"SUPER_ADMIN".equals(user.getRole()) && !"FAMILY_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body("Access denied.");
        }
        return ResponseEntity.ok(feedbackRepository.findAll());
    }

    @PatchMapping("/{feedbackId}/status")
    public ResponseEntity<?> updateStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String feedbackId,
            @RequestBody Map<String, String> body) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (!"SUPER_ADMIN".equals(user.getRole()) && !"FAMILY_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body("Access denied.");
        }
        feedbackRepository.findById(feedbackId).ifPresent(fb -> {
            fb.setStatus(body.getOrDefault("status", "REVIEWED"));
            feedbackRepository.save(fb);
        });
        return ResponseEntity.ok(Map.of("message", "Status updated."));
    }
}
