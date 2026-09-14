package com.questhive.questhive.service;

import com.questhive.questhive.model.Conversation;
import com.questhive.questhive.model.DirectMessage;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.ConversationRepository;
import com.questhive.questhive.repository.DirectMessageRepository;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DmService {

    private final ConversationRepository conversationRepository;
    private final DirectMessageRepository directMessageRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Conversation startConversation(String userId, String otherUserId, String contextTaskId) {
        if (userId.equals(otherUserId)) {
            throw new RuntimeException("Cannot start a conversation with yourself.");
        }
        userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        String sharedGroupId = findSharedGroupId(userId, otherUserId);
        if (sharedGroupId == null) {
            throw new RuntimeException("You can only message members of a group you share.");
        }

        List<String> sortedIds = sortedPair(userId, otherUserId);
        Conversation existing = conversationRepository.findByParticipantIds(sortedIds).orElse(null);
        if (existing != null) {
            if (contextTaskId != null && existing.getContextTaskId() == null) {
                existing.setContextTaskId(contextTaskId);
                conversationRepository.save(existing);
            }
            return existing;
        }

        Conversation convo = new Conversation();
        convo.setGroupId(sharedGroupId);
        convo.setParticipantIds(sortedIds);
        convo.setContextTaskId(contextTaskId);
        return conversationRepository.save(convo);
    }

    public List<Map<String, Object>> getMyConversations(String userId) {
        List<Conversation> conversations = conversationRepository
                .findByParticipantIdsContainsOrderByLastMessageAtDesc(userId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Conversation c : conversations) {
            String otherUserId = c.getParticipantIds().stream()
                    .filter(id -> !id.equals(userId)).findFirst().orElse(null);
            User other = otherUserId != null ? userRepository.findById(otherUserId).orElse(null) : null;
            long unread = unreadInConversation(c.getId(), userId);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("conversationId", c.getId());
            row.put("otherUserId", otherUserId);
            row.put("otherUserName", other != null ? other.getFullName() : "Unknown");
            row.put("lastMessagePreview", c.getLastMessagePreview());
            row.put("lastMessageAt", c.getLastMessageAt());
            row.put("contextTaskId", c.getContextTaskId());
            row.put("unreadCount", unread);
            result.add(row);
        }
        return result;
    }

    public List<DirectMessage> getMessages(String userId, String conversationId) {
        Conversation convo = getConversationForParticipant(userId, conversationId);
        return directMessageRepository.findByConversationIdOrderBySentAtAsc(convo.getId());
    }

    public DirectMessage sendMessage(String userId, String conversationId, String content) {
        Conversation convo = getConversationForParticipant(userId, conversationId);
        if (content == null || content.isBlank()) {
            throw new RuntimeException("Message cannot be empty.");
        }
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        DirectMessage msg = new DirectMessage();
        msg.setConversationId(convo.getId());
        msg.setSenderId(userId);
        msg.setSenderName(sender.getFullName() != null ? sender.getFullName() : sender.getUsername());
        msg.setContent(content);
        msg.getReadBy().add(userId);
        DirectMessage saved = directMessageRepository.save(msg);

        convo.setLastMessageAt(LocalDateTime.now());
        convo.setLastMessagePreview(content.length() > 80 ? content.substring(0, 80) + "…" : content);
        conversationRepository.save(convo);

        messagingTemplate.convertAndSend("/topic/dm/" + convo.getId(), saved);

        String recipientId = convo.getParticipantIds().stream()
                .filter(id -> !id.equals(userId)).findFirst().orElse(null);
        if (recipientId != null) {
            pushUnreadCount(recipientId);
        }

        return saved;
    }

    public void markRead(String userId, String conversationId) {
        Conversation convo = getConversationForParticipant(userId, conversationId);
        List<DirectMessage> unread = directMessageRepository.findByConversationIdOrderBySentAtAsc(convo.getId())
                .stream()
                .filter(m -> !m.getReadBy().contains(userId))
                .collect(Collectors.toList());
        unread.forEach(m -> m.getReadBy().add(userId));
        directMessageRepository.saveAll(unread);
        pushUnreadCount(userId);
    }

    public long getTotalUnreadCount(String userId) {
        List<Conversation> conversations = conversationRepository
                .findByParticipantIdsContainsOrderByLastMessageAtDesc(userId);
        long total = 0;
        for (Conversation c : conversations) {
            total += unreadInConversation(c.getId(), userId);
        }
        return total;
    }

    private long unreadInConversation(String conversationId, String userId) {
        return directMessageRepository.findByConversationIdOrderBySentAtAsc(conversationId).stream()
                .filter(m -> !m.getSenderId().equals(userId) && !m.getReadBy().contains(userId))
                .count();
    }

    private void pushUnreadCount(String userId) {
        long unread = getTotalUnreadCount(userId);
        messagingTemplate.convertAndSend("/topic/dm-unread/" + userId, Map.of("unreadCount", unread));
    }

    private Conversation getConversationForParticipant(String userId, String conversationId) {
        Conversation convo = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found."));
        if (!convo.getParticipantIds().contains(userId)) {
            throw new RuntimeException("You are not part of this conversation.");
        }
        return convo;
    }

    private String findSharedGroupId(String userId, String otherUserId) {
        return groupRepository.findByMemberIdsContaining(userId).stream()
                .filter(g -> g.getMemberIds() != null && g.getMemberIds().contains(otherUserId))
                .map(com.questhive.questhive.model.Group::getId)
                .findFirst()
                .orElse(null);
    }

    private List<String> sortedPair(String a, String b) {
        List<String> ids = new ArrayList<>(List.of(a, b));
        Collections.sort(ids);
        return ids;
    }
}
