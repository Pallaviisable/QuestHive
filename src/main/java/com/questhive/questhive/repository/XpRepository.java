package com.questhive.questhive.repository;

import com.questhive.questhive.model.XpRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface XpRepository extends MongoRepository<XpRecord, String> {
    List<XpRecord> findByUserId(String userId);
    List<XpRecord> findByGroupId(String groupId);
}
