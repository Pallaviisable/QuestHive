package com.questhive.questhive.service;

import com.questhive.questhive.model.AdminRequest;
import com.questhive.questhive.model.Invite;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.AdminRequestRepository;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final AdminRequestRepository adminRequestRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final InviteService inviteService;
    private final EmailService emailService;

    @Value("${questhive.frontend.url}")
    private String frontendUrl;

    public List<AdminRequest> getPendingRequests() {
        return adminRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    public List<AdminRequest> getAllRequests() {
        return adminRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public void approveRequest(String requestId) {
        AdminRequest request = adminRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found."));
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("This request has already been processed.");
        }
        request.setStatus("APPROVED");
        adminRequestRepository.save(request);

        Invite invite = inviteService.createAdminInvite(request.getEmail());
        String registrationLink = frontendUrl + "/register?token=" + invite.getToken();
        emailService.sendAdminRequestApproved(request.getEmail(), request.getFullName(), registrationLink);
    }

    public void rejectRequest(String requestId) {
        AdminRequest request = adminRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found."));
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("This request has already been processed.");
        }
        request.setStatus("REJECTED");
        adminRequestRepository.save(request);
        emailService.sendAdminRequestRejected(request.getEmail(), request.getFullName());
    }

    public List<User> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(u -> !"SUPER_ADMIN".equals(u.getRole()))
                .toList();
    }

    public void removeUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if ("SUPER_ADMIN".equals(user.getRole())) {
            throw new RuntimeException("Cannot remove Super Admin.");
        }
        groupRepository.findByMemberIdsContaining(userId).forEach(group -> {
            group.getMemberIds().remove(userId);
            groupRepository.save(group);
        });
        userRepository.delete(user);
    }

    public void deactivateUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if ("SUPER_ADMIN".equals(user.getRole())) {
            throw new RuntimeException("Cannot deactivate Super Admin.");
        }
        user.setStatus("DEACTIVATED");
        userRepository.save(user);
        emailService.sendAccountDeactivated(user.getEmail(), user.getFullName());
    }

    public void activateUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        user.setStatus("ACTIVE");
        userRepository.save(user);
        emailService.sendAccountReactivated(user.getEmail(), user.getFullName());
    }
}