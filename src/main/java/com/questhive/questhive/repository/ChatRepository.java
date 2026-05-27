package com.questhive.questhive.repository;

import com.questhive.questhive.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ChatRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByGroupIdOrderBySentAtAsc(String groupId);
    List<ChatMessage> findTop100ByGroupIdOrderBySentAtDesc(String groupId);
}
