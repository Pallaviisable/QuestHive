package com.questhive.questhive.controller;

import com.questhive.questhive.dto.GroupDetailDTO;
import com.questhive.questhive.model.Group;
import com.questhive.questhive.model.GroupActivity;
import com.questhive.questhive.repository.TaskRepository;
import com.questhive.questhive.service.GroupService;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final TaskRepository taskRepository;
    private final JwtUtil jwtUtil;

    private String extractUserId(String authHeader) {
        return jwtUtil.extractUserId(authHeader.substring(7));
    }

    @PostMapping("/create")
    public ResponseEntity<Group> createGroup(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        String template = body.getOrDefault("template", "CUSTOM");
        return ResponseEntity.ok(
                groupService.createGroup(extractUserId(auth), body.get("name"), body.get("description"), template));
    }

    @PostMapping("/join")
    public ResponseEntity<Group> joinByInviteCode(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(groupService.joinByInviteCode(extractUserId(auth), body.get("inviteCode")));
    }

    @PostMapping("/{groupId}/invite-email")
    public ResponseEntity<?> inviteByEmail(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId,
            @RequestBody Map<String, String> body) {
        try {
            groupService.inviteByEmail(extractUserId(auth), groupId, body.get("email"));
            return ResponseEntity.ok(Map.of("message", "Invite link sent successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Enhancement #3 + #4: deactivate now accepts reason in body
    @PostMapping("/{groupId}/members/{memberId}/deactivate")
    public ResponseEntity<?> deactivateMember(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId,
            @PathVariable String memberId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body != null ? body.getOrDefault("reason", "") : "";
            groupService.deactivateMember(extractUserId(auth), groupId, memberId, reason);
            return ResponseEntity.ok(Map.of("message", "Member deactivated in this group."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/members/{memberId}/reactivate")
    public ResponseEntity<?> reactivateMember(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId,
            @PathVariable String memberId) {
        try {
            groupService.reactivateMember(extractUserId(auth), groupId, memberId);
            return ResponseEntity.ok(Map.of("message", "Member reactivated."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<Group>> myGroups(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(groupService.getGroupsForUser(extractUserId(auth)));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<Group> getGroup(@RequestHeader("Authorization") String auth,
                                          @PathVariable String groupId) {
        return ResponseEntity.ok(groupService.getGroupById(groupId));
    }

    @GetMapping("/{groupId}/detail")
    public ResponseEntity<GroupDetailDTO> getGroupDetail(@RequestHeader("Authorization") String auth,
                                                          @PathVariable String groupId) {
        return ResponseEntity.ok(groupService.getGroupDetail(groupId));
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(@RequestHeader("Authorization") String auth,
                                        @PathVariable String groupId) {
        groupService.leaveGroup(extractUserId(auth), groupId);
        return ResponseEntity.ok(Map.of("message", "Left group successfully."));
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<?> removeMember(@RequestHeader("Authorization") String auth,
                                          @PathVariable String groupId,
                                          @PathVariable String memberId,
                                          @RequestParam(required = false) String reason) {
        groupService.removeMember(extractUserId(auth), groupId, memberId, reason);
        return ResponseEntity.ok(Map.of("message", "Member removed."));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@RequestHeader("Authorization") String auth,
                                         @PathVariable String groupId) {
        groupService.deleteGroup(extractUserId(auth), groupId);
        return ResponseEntity.ok(Map.of("message", "Group deleted."));
    }

    @PostMapping("/{groupId}/regenerate-code")
    public ResponseEntity<Group> regenerateCode(@RequestHeader("Authorization") String auth,
                                                 @PathVariable String groupId) {
        return ResponseEntity.ok(groupService.regenerateInviteCode(extractUserId(auth), groupId));
    }

    @GetMapping("/{groupId}/activities")
    public ResponseEntity<List<GroupActivity>> getActivities(@RequestHeader("Authorization") String auth,
                                                              @PathVariable String groupId) {
        return ResponseEntity.ok(groupService.getGroupActivities(groupId));
    }

    @GetMapping("/{groupId}/health")
    public ResponseEntity<?> getGroupHealth(@PathVariable String groupId) {
        List<com.questhive.questhive.model.Task> tasks = taskRepository.findByGroupId(groupId);
        long total = tasks.size();
        long completed = tasks.stream()
                .filter(t -> t.getStatus() == com.questhive.questhive.model.Task.Status.COMPLETED)
                .count();
        long overdue = tasks.stream()
                .filter(t -> t.getStatus() != com.questhive.questhive.model.Task.Status.COMPLETED
                        && t.getDeadline() != null
                        && t.getDeadline().isBefore(java.time.LocalDateTime.now()))
                .count();
        int healthPercent = total == 0 ? 100 : (int) ((completed * 100.0) / total);
        String status = healthPercent >= 75 ? "HEALTHY" : healthPercent >= 40 ? "AT_RISK" : "CRITICAL";
        return ResponseEntity.ok(Map.of(
                "total", total,
                "completed", completed,
                "overdue", overdue,
                "healthPercent", healthPercent,
                "status", status));
    }
}
