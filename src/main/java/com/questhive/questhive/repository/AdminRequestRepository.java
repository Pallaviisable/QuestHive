package com.questhive.questhive.repository;

import com.questhive.questhive.model.AdminRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface AdminRequestRepository extends MongoRepository<AdminRequest, String> {
    List<AdminRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<AdminRequest> findAllByOrderByCreatedAtDesc();
    Optional<AdminRequest> findByEmail(String email);
    boolean existsByEmailAndStatus(String email, String status);
}