package com.questhive.questhive.repository;

import com.questhive.questhive.model.GroupActivity;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface GroupActivityRepository extends MongoRepository<GroupActivity, String> {
    List<GroupActivity> findByGroupIdOrderByCreatedAtDesc(String groupId);
}