package com.questhive.questhive.controller;

import com.questhive.questhive.service.FairnessService;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/fairness")
@RequiredArgsConstructor
public class FairnessController {

    private final FairnessService fairnessService;
    private final JwtUtil jwtUtil;

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getFairnessReport(@PathVariable String groupId) {
        return ResponseEntity.ok(fairnessService.getFairnessReport(groupId));
    }


    @GetMapping("/{groupId}/concentration")
    public ResponseEntity<?> getConcentrationReport(@PathVariable String groupId) {
        return ResponseEntity.ok(fairnessService.getConcentrationReport(groupId));
    }

    @PostMapping("/tasks/{taskId}/bonus-review")
    public ResponseEntity<?> requestBonusReview(
            @PathVariable String taskId,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        int bonusCoins = (int) body.getOrDefault("bonusCoins", 0);
        return ResponseEntity.ok(fairnessService.requestBonusReview(taskId, userId, bonusCoins));
    }

    @PostMapping("/tasks/{taskId}/flag-bonus")
    public ResponseEntity<?> flagBonus(
            @PathVariable String taskId,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(fairnessService.flagBonus(taskId, userId));
    }

    @GetMapping("/tasks/{taskId}/review-status")
    public ResponseEntity<?> getReviewStatus(@PathVariable String taskId) {
        return ResponseEntity.ok(fairnessService.getReviewStatus(taskId));
    }
}
