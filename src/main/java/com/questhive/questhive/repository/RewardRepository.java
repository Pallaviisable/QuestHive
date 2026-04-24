package com.questhive.questhive.repository;

import com.questhive.questhive.model.Reward;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RewardRepository extends MongoRepository<Reward, String>
{
    List<Reward> findByUserId(String userId);
    List<Reward> findByGroupId(String groupId);
    List<Reward> findByUserIdAndGroupId(String userId, String groupId);
    List<Reward> findByGroupIdAndEarnedAtAfter(String groupId, LocalDateTime after);
}