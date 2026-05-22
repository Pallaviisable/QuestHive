package com.questhive.questhive.controller;

import com.questhive.questhive.model.AdminRequest;
import com.questhive.questhive.model.Invite;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.AdminRequestRepository;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.UserRepository;
import com.questhive.questhive.service.EmailService;
import com.questhive.questhive.service.InviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/invite")
@RequiredArgsConstructor
public class InviteController {

    private final InviteService inviteService;
    private final AdminRequestRepository adminRequestRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${questhive.superadmin.email}")
    private String superAdminEmail;

    // Called by /invite-preview and /register pages on load
    @GetMapping("/validate")
    public ResponseEntity<?> validateInvite(@RequestParam String token) {
        try {
            Invite invite = inviteService.validateToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("email", invite.getEmail());
            response.put("type", invite.getType());
            response.put("token", token);
            response.put("alreadyRegistered", false);

            // Check if user already exists with this email
            Optional<User> existingUser = userRepository.findByEmail(invite.getEmail());
            if (existingUser.isPresent()) {
                // For MEMBER invites: auto-add them to the group, mark invite used
                if ("MEMBER".equals(invite.getType()) && invite.getGroupId() != null) {
                    groupRepository.findById(invite.getGroupId()).ifPresent(group -> {
                        if (!group.getMemberIds().contains(existingUser.get().getId())) {
                            group.getMemberIds().add(existingUser.get().getId());
                            groupRepository.save(group);
                        }
                    });
                    inviteService.markUsed(token);
                }
                response.put("alreadyRegistered", true);
                response.put("message", "You already have a QuestHive account. Login to access your group.");
            }

            if (invite.getGroupId() != null) {
                groupRepository.findById(invite.getGroupId()).ifPresent(group -> {
                    response.put("groupName", group.getName());
                    response.put("groupDescription", group.getDescription());
                    response.put("memberCount", group.getMemberIds().size());
                });
            }

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Called from /request-access page
    @PostMapping("/request-access")
    public ResponseEntity<?> requestAdminAccess(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String fullName = body.get("fullName");
            String reason = body.get("reason");

            if (email == null || fullName == null || reason == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "All fields are required."));
            }

            if (adminRequestRepository.existsByEmailAndStatus(email.trim().toLowerCase(), "PENDING")) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "A request from this email is already pending review."));
            }

            AdminRequest request = new AdminRequest();
            request.setFullName(fullName.trim());
            request.setEmail(email.trim().toLowerCase());
            request.setReason(reason.trim());
            adminRequestRepository.save(request);

            emailService.sendAdminRequestNotification(superAdminEmail, fullName, email, reason);
            emailService.sendAdminRequestReceived(email, fullName);

            return ResponseEntity.ok(Map.of("message",
                    "Request submitted! You'll hear back via email once reviewed."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}