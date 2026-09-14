package com.questhive.questhive.repository;

import com.questhive.questhive.model.DirectMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DirectMessageRepository extends MongoRepository<DirectMessage, String> {
    List<DirectMessage> findByConversationIdOrderBySentAtAsc(String conversationId);
}
