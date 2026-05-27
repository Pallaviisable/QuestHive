package com.questhive.questhive.controller;

import com.questhive.questhive.service.XpService;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/xp")
@RequiredArgsConstructor
public class XpController {

    private final XpService xpService;
    private final JwtUtil jwtUtil;

    @GetMapping("/me")
    public ResponseEntity<?> getMyXp(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(xpService.getUserXpSummary(userId));
    }
}
