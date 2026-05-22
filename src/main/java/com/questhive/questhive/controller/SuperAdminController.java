package com.questhive.questhive.controller;

import com.questhive.questhive.model.AdminRequest;
import com.questhive.questhive.model.User;
import com.questhive.questhive.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    @GetMapping("/requests")
    public ResponseEntity<List<AdminRequest>> getPendingRequests() {
        return ResponseEntity.ok(superAdminService.getPendingRequests());
    }

    @GetMapping("/requests/all")
    public ResponseEntity<List<AdminRequest>> getAllRequests() {
        return ResponseEntity.ok(superAdminService.getAllRequests());
    }

    @PostMapping("/requests/{id}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable String id) {
        try {
            superAdminService.approveRequest(id);
            return ResponseEntity.ok(Map.of("message", "Approved. Registration link sent to applicant."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable String id) {
        try {
            superAdminService.rejectRequest(id);
            return ResponseEntity.ok(Map.of("message", "Request rejected."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(superAdminService.getAllUsers());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> removeUser(@PathVariable String id) {
        try {
            superAdminService.removeUser(id);
            return ResponseEntity.ok(Map.of("message", "User removed from platform."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable String id) {
        try {
            superAdminService.deactivateUser(id);
            return ResponseEntity.ok(Map.of("message", "User deactivated."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/activate")
    public ResponseEntity<?> activateUser(@PathVariable String id) {
        try {
            superAdminService.activateUser(id);
            return ResponseEntity.ok(Map.of("message", "User reactivated."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}