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

    // ── NEW: invite-based registration ───────────────────────────────────────
    public void register(String fullName, String username, String email,
                         String password, String inviteToken, String captchaToken) {

        // 1. Verify CAPTCHA (skipped locally if secret is blank)
        verifyCaptcha(captchaToken);

        // 2. Validate invite token
        Invite invite = inviteService.validateToken(inviteToken);
        if (!invite.getEmail().equalsIgnoreCase(email.trim())) {
            throw new RuntimeException(
                    "This invite was sent to " + invite.getEmail() + ". Use that email to register.");
        }

        // 3. Check for duplicate account
        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            throw new RuntimeException("An account with this email already exists. Please login.");
        }
        if (userRepository.existsByUsername(username.trim())) {
            throw new RuntimeException("This username is already taken. Please choose another.");
        }

        // 4. Determine role from invite type
        String role = "ADMIN".equals(invite.getType()) ? "FAMILY_ADMIN" : "MEMBER";

        // 5. Create user — no OTP needed, email was verified by clicking the link
        User user = new User();
        user.setFullName(fullName.trim());
        user.setUsername(username.trim());
        user.setEmail(email.trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(password));
        user.setVerified(true);
        user.setRole(role);
        user.setStatus("ACTIVE");
        user.setHasSeenTour(false);
        userRepository.save(user);

        // 6. If MEMBER invite, add to group immediately
        if ("MEMBER".equals(invite.getType()) && invite.getGroupId() != null) {
            groupRepository.findById(invite.getGroupId()).ifPresent(group -> {
                if (!group.getMemberIds().contains(user.getId())) {
                    group.getMemberIds().add(user.getId());
                    groupRepository.save(group);
                }
            });
        }

        // 7. Mark invite as used
        inviteService.markUsed(inviteToken);

        // 8. Welcome email
        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
    }

    // ── Login: now checks status ──────────────────────────────────────────────
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
        return jwtUtil.generateToken(user.getId(), user.getEmail());
    }

    // ── Onboarding tour complete ──────────────────────────────────────────────
    public void completeTour(String userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setHasSeenTour(true);
            userRepository.save(user);
        });
    }

    // ── CAPTCHA verification ──────────────────────────────────────────────────
    private void verifyCaptcha(String captchaToken) {
        if (hcaptchaSecret == null || hcaptchaSecret.isBlank()) {
            return; // skip in local dev when secret not configured
        }
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

    // ── All existing methods below — unchanged ────────────────────────────────

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

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email."));
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendOtp(email, otp);
    }

    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (user.getOtpCode() == null || !user.getOtpCode().equals(otp)) {
            throw new RuntimeException("Invalid OTP. Please try again.");
        }
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }

    public User updateProfile(String userId, String fullName, String newUsername,
                              String newPassword, String currentPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (fullName != null && !fullName.isBlank()) user.setFullName(fullName);
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
        String otp = String.format("%06d", new Random().nextInt(999999));
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
}