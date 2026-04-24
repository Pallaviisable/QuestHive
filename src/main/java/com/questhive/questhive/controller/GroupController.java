package com.questhive.questhive.controller;

import com.questhive.questhive.dto.GroupDetailDTO;
import com.questhive.questhive.model.Group;
import com.questhive.questhive.model.GroupActivity;
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
    private final JwtUtil jwtUtil;

    private String extractUserId(String authHeader) {
        return jwtUtil.extractUserId(authHeader.substring(7));
    }

    @PostMapping("/create")
    public ResponseEntity<Group> createGroup(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        String userId = extractUserId(auth);
        return ResponseEntity.ok(groupService.createGroup(userId, body.get("name"), body.get("description")));
    }

    @PostMapping("/join")
    public ResponseEntity<Group> joinByInviteCode(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        String userId = extractUserId(auth);
        return ResponseEntity.ok(groupService.joinByInviteCode(userId, body.get("inviteCode")));
    }

    @PostMapping("/{groupId}/invite-email")
    public ResponseEntity<?> inviteByEmail(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId,
            @RequestBody Map<String, String> body) {
        String userId = extractUserId(auth);
        groupService.inviteByEmail(userId, groupId, body.get("email"));
        return ResponseEntity.ok(Map.of("message", "Invite sent successfully."));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Group>> myGroups(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(groupService.getGroupsForUser(extractUserId(auth)));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<Group> getGroup(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        return ResponseEntity.ok(groupService.getGroupById(groupId));
    }

    @GetMapping("/{groupId}/detail")
    public ResponseEntity<GroupDetailDTO> getGroupDetail(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        return ResponseEntity.ok(groupService.getGroupDetail(groupId));
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        groupService.leaveGroup(extractUserId(auth), groupId);
        return ResponseEntity.ok(Map.of("message", "Left group successfully."));
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<?> removeMember(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId,
            @PathVariable String memberId) {
        groupService.removeMember(extractUserId(auth), groupId, memberId);
        return ResponseEntity.ok(Map.of("message", "Member removed."));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        groupService.deleteGroup(extractUserId(auth), groupId);
        return ResponseEntity.ok(Map.of("message", "Group deleted."));
    }

    @PostMapping("/{groupId}/regenerate-code")
    public ResponseEntity<Group> regenerateCode(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        return ResponseEntity.ok(groupService.regenerateInviteCode(extractUserId(auth), groupId));
    }

    // ← NEW: activity feed
    @GetMapping("/{groupId}/activities")
    public ResponseEntity<List<GroupActivity>> getActivities(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        return ResponseEntity.ok(groupService.getGroupActivities(groupId));
    }
}