package com.questhive.questhive.repository;

import com.questhive.questhive.model.Location;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends MongoRepository<Location, String> {
    Optional<Location> findByUserId(String userId);
    List<Location> findByUserIdIn(List<String> userIds);
}