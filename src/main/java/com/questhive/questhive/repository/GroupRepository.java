package com.questhive.questhive.repository;

import com.questhive.questhive.model.Group;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends MongoRepository<Group, String> {
    List<Group> findByAdminId(String adminId);
    List<Group> findByMemberIdsContaining(String userId);
    Optional<Group> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);
}