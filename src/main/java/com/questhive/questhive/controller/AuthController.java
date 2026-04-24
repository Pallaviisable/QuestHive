package com.questhive.questhive.controller;

import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.UserRepository;
import com.questhive.questhive.service.AuthService;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    private String extractUserId(String authHeader) {
        return jwtUtil.extractUserId(authHeader.substring(7));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            authService.register(body.get("fullName"), body.get("username"), body.get("email"), body.get("password"));
            return ResponseEntity.ok(Map.of("message", "OTP sent to your email. Please verify."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> body) {
        try {
            authService.verifyEmail(body.get("email"), body.get("otp"));
            return ResponseEntity.ok(Map.of("message", "Email verified! You can now login."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String token = authService.login(email, body.get("password"));
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(Map.of("token", token, "user", user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            authService.forgotPassword(body.get("email"));
            return ResponseEntity.ok(Map.of("message", "OTP sent to your email."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            authService.resetPassword(body.get("email"), body.get("otp"), body.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Password reset successful."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ← newUsername added
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        try {
            String userId = extractUserId(auth);
            User updated = authService.updateProfile(
                    userId,
                    body.get("fullName"),
                    body.get("newUsername"),
                    body.get("newPassword"),
                    body.get("currentPassword")
            );
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully.", "user", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/email-change/request")
    public ResponseEntity<?> requestEmailChange(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        try {
            authService.requestEmailChange(extractUserId(auth), body.get("newEmail"));
            return ResponseEntity.ok(Map.of("message", "OTP sent to your new email. Please verify."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/email-change/confirm")
    public ResponseEntity<?> confirmEmailChange(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        try {
            User updated = authService.confirmEmailChange(extractUserId(auth), body.get("otp"));
            return ResponseEntity.ok(Map.of("message", "Email updated successfully.", "user", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(@RequestBody Map<String, String> body) {
        try {
            authService.deleteAccount(body.get("userId"), body.get("password"));
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}