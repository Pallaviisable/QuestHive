package com.questhive.questhive.controller;

import com.questhive.questhive.model.Conversation;
import com.questhive.questhive.model.DirectMessage;
import com.questhive.questhive.service.DmService;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
public class DmController {

    private final DmService dmService;
    private final JwtUtil jwtUtil;

    private String extractUserId(String authHeader) {
        return jwtUtil.extractUserId(authHeader.substring(7));
    }

    @PostMapping("/conversations/start")
    public ResponseEntity<?> startConversation(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        try {
            String userId = extractUserId(auth);
            Conversation convo = dmService.startConversation(
                    userId, body.get("otherUserId"), body.get("taskId"));
            return ResponseEntity.ok(convo);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getMyConversations(@RequestHeader("Authorization") String auth) {
        String userId = extractUserId(auth);
        return ResponseEntity.ok(dmService.getMyConversations(userId));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<?> getMessages(
            @RequestHeader("Authorization") String auth,
            @PathVariable String conversationId) {
        try {
            String userId = extractUserId(auth);
            List<DirectMessage> messages = dmService.getMessages(userId, conversationId);
            return ResponseEntity.ok(messages);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<?> sendMessage(
            @RequestHeader("Authorization") String auth,
            @PathVariable String conversationId,
            @RequestBody Map<String, String> body) {
        try {
            String userId = extractUserId(auth);
            DirectMessage msg = dmService.sendMessage(userId, conversationId, body.get("content"));
            return ResponseEntity.ok(msg);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{conversationId}/read")
    public ResponseEntity<?> markRead(
            @RequestHeader("Authorization") String auth,
            @PathVariable String conversationId) {
        try {
            String userId = extractUserId(auth);
            dmService.markRead(userId, conversationId);
            return ResponseEntity.ok(Map.of("message", "Marked as read."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String auth) {
        String userId = extractUserId(auth);
        return ResponseEntity.ok(Map.of("unreadCount", dmService.getTotalUnreadCount(userId)));
    }
}
