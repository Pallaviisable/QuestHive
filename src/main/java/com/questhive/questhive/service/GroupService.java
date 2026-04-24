package com.questhive.questhive.service;

import com.questhive.questhive.dto.GroupDetailDTO;
import com.questhive.questhive.dto.MemberDTO;
import com.questhive.questhive.model.Group;
import com.questhive.questhive.model.GroupActivity;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.GroupActivityRepository;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final GroupActivityRepository groupActivityRepository;

    public Group createGroup(String adminId, String name, String description) {
        Group group = new Group();
        group.setName(name);
        group.setDescription(description);
        group.setAdminId(adminId);
        group.setInviteCode(generateUniqueInviteCode());
        group.setMemberIds(new ArrayList<>(List.of(adminId)));
        group.setCreatedAt(LocalDateTime.now());
        return groupRepository.save(group);
    }

    public Group joinByInviteCode(String userId, String inviteCode) {
        Group group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid invite code."));
        if (group.getMemberIds().contains(userId)) {
            throw new RuntimeException("You are already a member of this group.");
        }
        group.getMemberIds().add(userId);
        groupRepository.save(group);
        userRepository.findById(userId).ifPresent(user ->
                logActivity(group.getId(), "MEMBER_JOINED", user.getFullName(), null, "joined the group", 0));
        return group;
    }

    public void inviteByEmail(String adminId, String groupId, String targetEmail) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));
        if (!group.getAdminId().equals(adminId)) {
            throw new RuntimeException("Only the group admin can invite members.");
        }
        userRepository.findByEmail(targetEmail).ifPresent(existingUser -> {
            if (group.getMemberIds().contains(existingUser.getId())) {
                throw new RuntimeException("User with email " + targetEmail + " is already a member of this group.");
            }
        });
        emailService.sendGroupInvite(targetEmail, group.getName(), group.getInviteCode());
    }

    public Group getGroupById(String groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));
    }

    public GroupDetailDTO getGroupDetail(String groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));

        List<String> validMemberIds = new ArrayList<>();
        List<MemberDTO> members = new ArrayList<>();

        for (String memberId : group.getMemberIds()) {
            userRepository.findById(memberId).ifPresent(u -> {
                validMemberIds.add(u.getId());
                members.add(new MemberDTO(u.getId(), u.getFullName(), u.getEmail(), u.getAvatarColor()));
            });
        }

        // Persist cleaned memberIds so ghost users don't come back
        if (validMemberIds.size() != group.getMemberIds().size()) {
            group.setMemberIds(validMemberIds);
            groupRepository.save(group);
        }

        GroupDetailDTO dto = new GroupDetailDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setAdminId(group.getAdminId());
        dto.setInviteCode(group.getInviteCode());
        dto.setCreatedAt(group.getCreatedAt());
        dto.setMembers(members);
        return dto;
    }

    public List<Group> getGroupsForUser(String userId) {
        return groupRepository.findByMemberIdsContaining(userId);
    }

    public List<Group> getGroupsAdminedBy(String userId) {
        return groupRepository.findByAdminId(userId);
    }

    public void leaveGroup(String userId, String groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));
        if (group.getAdminId().equals(userId)) {
            throw new RuntimeException("Admin cannot leave the group. Transfer ownership first.");
        }
        if (!group.getMemberIds().contains(userId)) {
            throw new RuntimeException("You are not a member of this group.");
        }
        group.getMemberIds().remove(userId);
        groupRepository.save(group);
        userRepository.findById(userId).ifPresent(user ->
                logActivity(groupId, "MEMBER_LEFT", user.getFullName(), null, "left the group", 0));
    }

    public void removeMember(String adminId, String groupId, String targetUserId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));
        if (!group.getAdminId().equals(adminId)) {
            throw new RuntimeException("Only the group admin can remove members.");
        }
        if (adminId.equals(targetUserId)) {
            throw new RuntimeException("Admin cannot remove themselves.");
        }
        group.getMemberIds().remove(targetUserId);
        groupRepository.save(group);
        userRepository.findById(targetUserId).ifPresent(target ->
                userRepository.findById(adminId).ifPresent(admin ->
                        logActivity(groupId, "MEMBER_REMOVED", admin.getFullName(), target.getFullName(),
                                target.getFullName() + " was removed from the group", 0)));
    }

    public void deleteGroup(String adminId, String groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));
        if (!group.getAdminId().equals(adminId)) {
            throw new RuntimeException("Only the group admin can delete the group.");
        }
        groupRepository.delete(group);
    }

    public Group regenerateInviteCode(String adminId, String groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));
        if (!group.getAdminId().equals(adminId)) {
            throw new RuntimeException("Only the group admin can regenerate the invite code.");
        }
        group.setInviteCode(generateUniqueInviteCode());
        return groupRepository.save(group);
    }

    public List<GroupActivity> getGroupActivities(String groupId) {
        return groupActivityRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        } while (groupRepository.existsByInviteCode(code));
        return code;
    }

    private void logActivity(String groupId, String type, String actorName, String targetName, String detail, int coins) {
        GroupActivity activity = new GroupActivity();
        activity.setGroupId(groupId);
        activity.setType(type);
        activity.setActorName(actorName);
        activity.setTargetName(targetName);
        activity.setDetail(detail);
        activity.setCoins(coins);
        groupActivityRepository.save(activity);
    }
}