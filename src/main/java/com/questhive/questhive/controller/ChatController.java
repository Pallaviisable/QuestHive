package com.questhive.questhive.controller;

import com.questhive.questhive.model.ChatMessage;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.ChatRepository;
import com.questhive.questhive.repository.UserRepository;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable String groupId,
                                          @RequestHeader("Authorization") String authHeader) {
        List<ChatMessage> messages = chatRepository.findTop100ByGroupIdOrderBySentAtDesc(groupId);
        Collections.reverse(messages);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable String groupId,
                                          @RequestHeader("Authorization") String authHeader,
                                          @RequestBody Map<String, String> body) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        User user = userRepository.findById(userId).orElseThrow();

        ChatMessage msg = new ChatMessage();
        msg.setGroupId(groupId);
        msg.setUserId(userId);
        msg.setAuthorName(user.getFullName() != null ? user.getFullName() : user.getUsername());
        msg.setContent(body.get("content"));
        chatRepository.save(msg);

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/chat/" + groupId, msg);
        return ResponseEntity.ok(msg);
    }
}
