package com.questhive.questhive.repository;

import com.questhive.questhive.model.Invite;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface InviteRepository extends MongoRepository<Invite, String> {
    Optional<Invite> findByToken(String token);
    boolean existsByEmailAndUsedFalse(String email);
}