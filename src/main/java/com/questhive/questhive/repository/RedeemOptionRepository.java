package com.questhive.questhive.repository;

import com.questhive.questhive.model.RedeemOption;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RedeemOptionRepository extends MongoRepository<RedeemOption, String> {
    List<RedeemOption> findByGroupIdAndIsActive(String groupId, boolean isActive);
}