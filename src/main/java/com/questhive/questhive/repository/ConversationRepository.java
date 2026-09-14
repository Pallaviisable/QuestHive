package com.questhive.questhive.repository;

import com.questhive.questhive.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    List<Conversation> findByParticipantIdsContainsOrderByLastMessageAtDesc(String userId);
    Optional<Conversation> findByParticipantIds(List<String> participantIds);
}
