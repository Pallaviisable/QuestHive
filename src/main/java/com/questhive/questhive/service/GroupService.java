package com.questhive.questhive.service;

import com.questhive.questhive.dto.GroupDetailDTO;
import com.questhive.questhive.dto.MemberDTO;
import com.questhive.questhive.model.Group;
import com.questhive.questhive.model.GroupActivity;
import com.questhive.questhive.model.Invite;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.GroupActivityRepository;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.TaskRepository;
import com.questhive.questhive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final GroupActivityRepository groupActivityRepository;
    private final InviteService inviteService;
    private final TaskRepository taskRepository;

    @Value("${questhive.frontend.url}")
    private String frontendUrl;

    private static final List<String> FAMILY_CATEGORIES =
            Arrays.asList("Household", "School", "Personal", "Groceries", "Health");

    public Group createGroup(String adminId, String name, String description, String template) {
        Group group = new Group();
        group.setName(name);
        group.setDescription(description);
        group.setAdminId(adminId);
        group.setMemberIds(new ArrayList<>(List.of(adminId)));
        group.setDeactivatedMemberIds(new ArrayList<>());
        group.setCreatedAt(LocalDateTime.now());
        group.setLastActivityAt(LocalDateTime.now());

        // Bug #5 fix: template properly sets categories
        if ("FAMILY".equalsIgnoreCase(template)) {
            group.setTemplate("FAMILY");
            group.setTaskCategories(new ArrayList<>(FAMILY_CATEGORIES));
        } else {
            group.setTemplate("CUSTOM");
            group.setTaskCategories(new ArrayList<>());
        }

        return groupRepository.save(group);
    }

    // Enhancement #9: "member already present" message
    public void inviteByEmail(String adminId, String groupId, String targetEmail) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));
        if (!group.getAdminId().equals(adminId)) {
            throw new RuntimeException("Only the group admin can invite members.");
        }

        userRepository.findByEmail(targetEmail).ifPresent(existingUser -> {
            if (group.getMemberIds().contains(existingUser.getId())) {
                throw new RuntimeException("This member is already present in the group.");
            }
        });

        Invite invite = inviteService.createMemberInvite(targetEmail, groupId, adminId);
        String inviteLink = frontendUrl + "/invite-preview?token=" + invite.getToken();
        emailService.sendMemberInviteLink(targetEmail, group.getName(), inviteLink);
        logActivity(groupId, "INVITE_SENT", null, null, "Invite sent to " + targetEmail, 0);
        updateLastActivity(groupId);
    }

    // Enhancement #3 + #4: deactivate with reason, send email
    public void deactivateMember(String adminId, String groupId, String targetUserId, String reason) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));
        if (!group.getAdminId().equals(adminId)) {
            throw new RuntimeException("Only the group admin can deactivate members.");
        }
        if (adminId.equals(targetUserId)) {
            throw new RuntimeException("Admin cannot deactivate themselves.");
        }
        if (group.getDeactivatedMemberIds() == null) group.setDeactivatedMemberIds(new ArrayList<>());
        if (!group.getDeactivatedMemberIds().contains(targetUserId)) {
            group.getDeactivatedMemberIds().add(targetUserId);
            groupRepository.save(group);
            userRepository.findById(targetUserId).ifPresent(target -> {
                logActivity(groupId, "MEMBER_DEACTIVATED", null, target.getFullName(),
                        target.getFullName() + " was deactivated in this group", 0);
                emailService.sendMemberDeactivatedInGroup(
                        target.getEmail(), target.getFullName(), group.getName(), reason);
            });
        }
    }

    public void reactivateMember(String adminId, String groupId, String targetUserId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));
        if (!group.getAdminId().equals(adminId)) {
            throw new RuntimeException("Only the group admin can reactivate members.");
        }
        if (group.getDeactivatedMemberIds() != null) {
            group.getDeactivatedMemberIds().remove(targetUserId);
            groupRepository.save(group);
        }
    }

    public Group joinByInviteCode(String userId, String inviteCode) {
        Group group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid invite code."));
        if (group.getMemberIds().contains(userId)) {
            throw new RuntimeException("You are already a member of this group.");
        }
        group.getMemberIds().add(userId);
        groupRepository.save(group);
        updateLastActivity(group.getId());
        userRepository.findById(userId).ifPresent(user ->
                logActivity(group.getId(), "MEMBER_JOINED", user.getFullName(),
                        null, "joined the group", 0));
        return group;
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
        dto.setTemplate(group.getTemplate());
        dto.setTaskCategories(group.getTaskCategories());
        dto.setCreatedAt(group.getCreatedAt());
        dto.setMembers(members);
        dto.setDeactivatedMemberIds(group.getDeactivatedMemberIds());
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
                logActivity(groupId, "MEMBER_LEFT", user.getFullName(),
                        null, "left the group", 0));
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
                        logActivity(groupId, "MEMBER_REMOVED", admin.getFullName(),
                                target.getFullName(), target.getFullName() + " was removed", 0)));
    }

    public void deleteGroup(String adminId, String groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found."));
        if (!group.getAdminId().equals(adminId)) {
            throw new RuntimeException("Only the group admin can delete the group.");
        }
        groupRepository.delete(group);
    }

    // Enhancement #8: delete all groups when admin user is deleted
    public void deleteAllGroupsByAdmin(String adminId) {
        List<Group> adminGroups = groupRepository.findByAdminId(adminId);
        groupRepository.deleteAll(adminGroups);
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

    // New Feature #2: update last activity timestamp
    public void updateLastActivity(String groupId) {
        groupRepository.findById(groupId).ifPresent(group -> {
            group.setLastActivityAt(LocalDateTime.now());
            groupRepository.save(group);
        });
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        } while (groupRepository.existsByInviteCode(code));
        return code;
    }

    private void logActivity(String groupId, String type, String actorName,
                             String targetName, String detail, int coins) {
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
