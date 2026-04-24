package com.questhive.questhive.controller;

import com.questhive.questhive.model.Reward;
import com.questhive.questhive.model.RedeemOption;
import com.questhive.questhive.service.RewardService;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;
    private final JwtUtil jwtUtil;

    private String extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtUtil.extractUserId(token);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Reward>> myRewards(
            @RequestHeader("Authorization") String auth) {
        String userId = extractUserId(auth);
        return ResponseEntity.ok(rewardService.getRewardsForUser(userId));
    }

    @GetMapping("/my/coins")
    public ResponseEntity<?> myCoins(
            @RequestHeader("Authorization") String auth) {
        String userId = extractUserId(auth);
        return ResponseEntity.ok(Map.of("coins", rewardService.getTotalCoins(userId)));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Reward>> groupRewards(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        return ResponseEntity.ok(rewardService.getRewardsForGroup(groupId));
    }

    @GetMapping("/group/{groupId}/leaderboard")
    public ResponseEntity<?> leaderboard(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        return ResponseEntity.ok(rewardService.getWeeklyLeaderboard(groupId));
    }

    @PostMapping("/group/{groupId}/redeem-options")
    public ResponseEntity<RedeemOption> createRedeemOption(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(rewardService.createRedeemOption(
                groupId,
                (String) body.get("title"),
                (String) body.get("description"),
                (Integer) body.get("coinsRequired")
        ));
    }

    @GetMapping("/group/{groupId}/redeem-options")
    public ResponseEntity<List<RedeemOption>> getRedeemOptions(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        return ResponseEntity.ok(rewardService.getActiveRedeemOptions(groupId));
    }

    @PostMapping("/redeem/{optionId}")
    public ResponseEntity<?> redeem(
            @RequestHeader("Authorization") String auth,
            @PathVariable String optionId) {
        String userId = extractUserId(auth);
        rewardService.redeemOption(userId, optionId);
        return ResponseEntity.ok(Map.of("message", "Redeemed successfully."));
    }

    @GetMapping("/group/{groupId}/redeem-history")
    public ResponseEntity<?> redeemHistory(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        return ResponseEntity.ok(rewardService.getRedeemHistory(groupId));
    }

    @DeleteMapping("/redeem-options/{optionId}")
    public ResponseEntity<?> deactivateOption(
            @RequestHeader("Authorization") String auth,
            @PathVariable String optionId) {
        rewardService.deactivateRedeemOption(optionId);
        return ResponseEntity.ok(Map.of("message", "Redeem option deactivated."));
    }
}