package com.questhive.questhive.repository;

import com.questhive.questhive.model.Feedback;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FeedbackRepository extends MongoRepository<Feedback, String> {
    List<Feedback> findByUserId(String userId);
    List<Feedback> findByStatus(String status);
}
