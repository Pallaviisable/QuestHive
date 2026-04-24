package com.questhive.questhive.repository;
import com.questhive.questhive.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends MongoRepository<Task, String>
{
    List<Task> findByGroupId(String groupId);
    List<Task> findByAssignedToId(String userId);
    List<Task> findByAssignedToIdAndIsPersonal(String userId, boolean isPersonal);
    List<Task> findByGroupIdAndStatus(String groupId, Task.Status status);
    List<Task> findByAssignedToIdAndStatus(String userId, Task.Status status);
    List<Task> findByAssignedByIdAndGroupId(String assignedById, String groupId);
    List<Task> findByAssignedToIdIsNullAndGroupIdIsNotNullAndCreatedAtBefore(LocalDateTime cutoff);
}