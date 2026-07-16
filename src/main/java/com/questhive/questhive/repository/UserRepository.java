package com.questhive.questhive.repository;

import com.questhive.questhive.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<User> findByIsVerifiedFalseAndCreatedAtBefore(LocalDateTime cutoff);
    Optional<User> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);
}
