package com.questhive.questhive.service;

import com.questhive.questhive.model.Invite;
import com.questhive.questhive.model.User;
import com.questhive.questhive.repository.GroupRepository;
import com.questhive.questhive.repository.UserRepository;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final InviteService inviteService;
    private final GroupRepository groupRepository;

    @Value("${hcaptcha.secret:}")
    private String hcaptchaSecret;

    @Value("${hcaptcha.verify.url:https://hcaptcha.com/siteverify}")
    private String hcaptchaVerifyUrl;

    // New signup flow: a single `code` field can be either
    //   (a) an existing user's personal invite code -> new user becomes FAMILY_ADMIN, no group join
    //   (b) a group invite token (existing Invite mechanism) -> new user becomes MEMBER, auto-joined to that group
    public void register(String fullName, String username, String email,
                         String password, String code, String captchaToken) {
        verifyCaptcha(captchaToken);

        if (code == null || code.trim().isBlank()) {
            throw new RuntimeException("An invite code is required to sign up.");
        }
        String trimmedCode = code.trim();

        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            throw new RuntimeException("An account with this email already exists. Please login.");
        }
        if (userRepository.existsByUsername(username.trim())) {
            throw new RuntimeException("This username is already taken. Please choose another.");
        }

        // Name minimum 3 characters
        if (fullName == null || fullName.trim().length() < 3) {
            throw new RuntimeException("Full name must be at least 3 characters.");
        }

        Optional<User> personalCodeOwner = userRepository.findByInviteCode(trimmedCode);

        if (personalCodeOwner.isPresent()) {
            // Path A: personal invite code -> Family Admin, no group involved
            User user = new User();
            user.setFullName(fullName.trim());
            user.setUsername(username.trim());
            user.setEmail(email.trim().toLowerCase());
            user.setPassword(passwordEncoder.encode(password));
            user.setVerified(true);
            user.setRole("FAMILY_ADMIN");
            user.setStatus("ACTIVE");
            user.setHasSeenTour(false);
            user.setCreatedAt(LocalDateTime.now());
            user.setInviteCode(generateUniqueInviteCode());
            userRepository.save(user);

            // Rotate the code owner's personal invite code so it can't be reused/redistributed.
            User owner = personalCodeOwner.get();
            owner.setInviteCode(generateUniqueInviteCode());
            userRepository.save(owner);

            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
            return;
        }

        // Path B: group invite token -> Member, auto-joined to that group
        Invite invite = inviteService.validateToken(trimmedCode);
        if (!invite.getEmail().equalsIgnoreCase(email.trim())) {
            throw new RuntimeException(
                    "This invite was sent to " + invite.getEmail() + ". Use that email to register.");
        }

        User user = new User();
        user.setFullName(fullName.trim());
        user.setUsername(username.trim());
        user.setEmail(email.trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(password));
        user.setVerified(true);
        user.setRole("MEMBER");
        user.setStatus("ACTIVE");
        user.setHasSeenTour(false);
        user.setCreatedAt(LocalDateTime.now());
        user.setInviteCode(generateUniqueInviteCode());
        userRepository.save(user);

        if (invite.getGroupId() != null) {
            groupRepository.findById(invite.getGroupId()).ifPresent(group -> {
                if (!group.getMemberIds().contains(user.getId())) {
                    group.getMemberIds().add(user.getId());
                    groupRepository.save(group);
                }
            });
        }

        inviteService.markUsed(trimmedCode);
        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            code = "QH-" + String.format("%06d", new Random().nextInt(999999));
        } while (userRepository.existsByInviteCode(code));
        return code;
    }

    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email."));
        if (!user.isVerified()) {
            throw new RuntimeException("Please verify your email before logging in.");
        }
        if ("DEACTIVATED".equals(user.getStatus())) {
            throw new RuntimeException(
                    "Your account has been deactivated. Please contact the administrator.");
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Incorrect password. Please try again.");
        }
        // Backfill: older accounts created before invite codes existed won't have one yet.
        if (user.getInviteCode() == null || user.getInviteCode().isBlank()) {
            user.setInviteCode(generateUniqueInviteCode());
            userRepository.save(user);
        }
        return jwtUtil.generateToken(user.getId(), user.getEmail());
    }

    public void completeTour(String userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setHasSeenTour(true);
            userRepository.save(user);
        });
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email."));
        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendOtp(email, otp);
    }

    // Resend OTP — generates a fresh code, invalidates old one
    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email."));
        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.resendOtp(email, otp);
    }

    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (user.getOtpCode() == null || !user.getOtpCode().equals(otp)) {
            throw new RuntimeException("Invalid OTP. Please try again.");
        }
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        // Bug #3 fix: new password cannot be same as current
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("New password cannot be the same as your current password.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }

    public void verifyEmail(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (user.getOtpCode() == null || !user.getOtpCode().equals(otp)) {
            throw new RuntimeException("Invalid OTP. Please try again.");
        }
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please register again.");
        }
        user.setVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }

    public User updateProfile(String userId, String fullName, String newUsername,
                              String newPassword, String currentPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (fullName != null && !fullName.isBlank()) {
            if (fullName.trim().length() < 3) {
                throw new RuntimeException("Full name must be at least 3 characters.");
            }
            user.setFullName(fullName.trim());
        }
        if (newUsername != null && !newUsername.isBlank() && !newUsername.equals(user.getUsername())) {
            if (user.isUsernameChanged()) throw new RuntimeException("Username can only be changed once.");
            if (userRepository.existsByUsername(newUsername)) throw new RuntimeException("Username already taken.");
            user.setUsername(newUsername);
            user.setUsernameChanged(true);
        }
        if (newPassword != null && !newPassword.isBlank()) {
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
                throw new RuntimeException("Current password is incorrect.");
            }
            if (passwordEncoder.matches(newPassword, user.getPassword())) {
                throw new RuntimeException("New password cannot be the same as your current password.");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
        }
        return userRepository.save(user);
    }

    public void requestEmailChange(String userId, String newEmail) {
        if (userRepository.existsByEmail(newEmail)) {
            throw new RuntimeException("This email is already in use.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (newEmail.equals(user.getEmail())) throw new RuntimeException("This is already your current email.");
        String otp = generateOtp();
        user.setPendingEmail(newEmail);
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendEmailChangeOtp(newEmail, otp);
    }

    public User confirmEmailChange(String userId, String otp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (user.getPendingEmail() == null) throw new RuntimeException("No email change was requested.");
        if (user.getOtpCode() == null || !user.getOtpCode().equals(otp)) throw new RuntimeException("Invalid OTP.");
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) throw new RuntimeException("OTP has expired.");
        user.setEmail(user.getPendingEmail());
        user.setPendingEmail(null);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        return userRepository.save(user);
    }

    public void deleteAccount(String userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Incorrect password. Cannot delete account.");
        }
        userRepository.delete(user);
    }

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    private void verifyCaptcha(String captchaToken) {
        if (hcaptchaSecret == null || hcaptchaSecret.isBlank()) return;
        if (captchaToken == null || captchaToken.isBlank()) {
            throw new RuntimeException("Please complete the CAPTCHA verification.");
        }
        try {
            RestTemplate restTemplate = new RestTemplate();
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret", hcaptchaSecret);
            params.add("response", captchaToken);
            ResponseEntity<Map> res = restTemplate.postForEntity(hcaptchaVerifyUrl, params, Map.class);
            Boolean success = res.getBody() != null && (Boolean) res.getBody().get("success");
            if (!Boolean.TRUE.equals(success)) {
                throw new RuntimeException("CAPTCHA verification failed. Please try again.");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("CAPTCHA error. Please try again.");
        }
    }
}
