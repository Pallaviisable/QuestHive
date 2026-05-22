package com.questhive.questhive.service;

import com.questhive.questhive.model.Invite;
import com.questhive.questhive.repository.InviteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InviteService {

    private final InviteRepository inviteRepository;

    public Invite createMemberInvite(String email, String groupId, String invitedByUserId) {
        Invite invite = new Invite();
        invite.setToken(UUID.randomUUID().toString());
        invite.setEmail(email.toLowerCase().trim());
        invite.setGroupId(groupId);
        invite.setInvitedByUserId(invitedByUserId);
        invite.setType("MEMBER");
        return inviteRepository.save(invite);
    }

    public Invite createAdminInvite(String email) {
        Invite invite = new Invite();
        invite.setToken(UUID.randomUUID().toString());
        invite.setEmail(email.toLowerCase().trim());
        invite.setGroupId(null);
        invite.setType("ADMIN");
        return inviteRepository.save(invite);
    }

    public Invite validateToken(String token) {
        Invite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException(
                        "Invalid invite link. Please ask the admin to resend."));
        if (invite.isUsed()) {
            throw new RuntimeException("This invite link has already been used.");
        }
        if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("This invite link has expired. Please ask the admin to resend.");
        }
        return invite;
    }

    public void markUsed(String token) {
        inviteRepository.findByToken(token).ifPresent(invite -> {
            invite.setUsed(true);
            inviteRepository.save(invite);
        });
    }
}