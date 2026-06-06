package com.questhive.questhive.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.sender.email:}")
    private String brevoSenderEmail;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private void sendEmail(String toEmail, String subject, String htmlContent) {
        try {
            if (brevoApiKey != null && !brevoApiKey.isEmpty()) {
                // Render: use Brevo REST API over HTTPS
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String from = (brevoSenderEmail != null && !brevoSenderEmail.isEmpty()) ? brevoSenderEmail : senderEmail;
                java.util.Map<String, Object> payload = java.util.Map.of(
                    "sender", java.util.Map.of("email", from, "name", "QuestHive"),
                    "to", java.util.List.of(java.util.Map.of("email", toEmail)),
                    "subject", subject,
                    "htmlContent", htmlContent
                );
                String body = mapper.writeValueAsString(payload);
                RestTemplate restTemplate = new RestTemplate();
                HttpHeaders headers = new HttpHeaders();
                headers.set("api-key", brevoApiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<String> entity = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, entity, String.class);
                System.out.println("EMAIL SUCCESS (Brevo API): Sent to " + toEmail + " | Status: " + response.getStatusCode());
            } else {
                // Local: use JavaMailSender (Gmail SMTP)
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(senderEmail, "QuestHive");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);
                mailSender.send(message);
                System.out.println("EMAIL SUCCESS (SMTP): Sent to " + toEmail);
            }
        } catch (Exception e) {
            System.out.println("EMAIL FAILED: " + e.getMessage());
            e.printStackTrace();
        }
    }
    private String baseTemplate(String title, String bodyContent) {
        return "<div style='font-family:Inter,sans-serif;background:#0f0f0f;padding:40px 0;min-height:100vh'>"
             + "<div style='max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden'>"
             + "<div style='background:linear-gradient(135deg,#1a1200,#2a1f00);padding:32px;text-align:center;border-bottom:1px solid #2a2a2a'>"
             + "<div style='font-size:36px;margin-bottom:8px'>🐝</div>"
             + "<div style='color:#f5c518;font-size:22px;font-weight:800;letter-spacing:-0.5px'>QuestHive</div>"
             + "</div>"
             + "<div style='padding:32px'>"
             + "<h2 style='color:#ffffff;font-size:20px;font-weight:700;margin:0 0 20px 0'>" + title + "</h2>"
             + bodyContent
             + "</div>"
             + "<div style='padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center'>"
             + "<p style='color:#444;font-size:12px;margin:0'>© 2026 QuestHive &nbsp;·&nbsp; Built for families who get things done 🐝</p>"
             + "</div>"
             + "</div>"
             + "</div>";
    }

    private String otpBox(String otp) {
        return "<div style='background:#0f0f0f;border:1px solid #2a2a2a;border-radius:12px;padding:24px;text-align:center;margin:24px 0'>"
             + "<p style='color:#888;font-size:12px;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:1px'>Your OTP</p>"
             + "<div style='color:#f5c518;font-size:40px;font-weight:900;letter-spacing:12px'>" + otp + "</div>"
             + "<p style='color:#666;font-size:12px;margin:12px 0 0 0'>Valid for <strong style='color:#f5c518'>10 minutes</strong> only</p>"
             + "</div>";
    }

    private String ctaButton(String label, String url) {
        return "<div style='text-align:center;margin:24px 0'>"
             + "<a href='" + url + "' style='background:#f5c518;color:#000;font-weight:800;font-size:14px;"
             + "padding:14px 32px;border-radius:10px;text-decoration:none;display:inline-block'>" + label + "</a>"
             + "</div>";
    }

    private String para(String text) {
        return "<p style='color:#ccc;font-size:14px;line-height:1.7;margin:0 0 14px 0'>" + text + "</p>";
    }

    // ── OTP: Password Reset ───────────────────────────────────────────────────
    @Async
    public void sendOtp(String toEmail, String otp) {
        String body = para("You requested a password reset for your QuestHive account.")
                    + otpBox(otp)
                    + para("Enter this code on the reset password page. If you did not request this, you can safely ignore this email.");
        sendEmail(toEmail, "QuestHive — Password Reset OTP", baseTemplate("Reset Your Password", body));
    }

    // ── OTP: Resend ───────────────────────────────────────────────────────────
    @Async
    public void resendOtp(String toEmail, String otp) {
        String body = para("You requested a new OTP. Your previous code has been invalidated.")
                    + otpBox(otp)
                    + para("This code is valid for 10 minutes. If you did not request this, please secure your account.");
        sendEmail(toEmail, "QuestHive — New OTP (Resent)", baseTemplate("New OTP Sent", body));
    }

    // ── OTP: Email Change ─────────────────────────────────────────────────────
    @Async
    public void sendEmailChangeOtp(String toEmail, String otp) {
        String body = para("You requested to change your email address on QuestHive. Use the code below to confirm.")
                    + otpBox(otp)
                    + para("If you did not request this change, please log in and secure your account immediately.");
        sendEmail(toEmail, "QuestHive — Verify New Email Address", baseTemplate("Confirm Your New Email", body));
    }

    // ── OTP: Signup (kept for legacy, not used in invite flow) ───────────────
    @Async
    public void sendSignupOtp(String toEmail, String otp) {
        String body = para("Welcome! Verify your email to complete your QuestHive signup.")
                    + otpBox(otp)
                    + para("This code expires in 10 minutes.");
        sendEmail(toEmail, "QuestHive — Verify Your Email", baseTemplate("Verify Your Email", body));
    }

    // ── Welcome Email ─────────────────────────────────────────────────────────
    @Async
    public void sendWelcomeEmail(String toEmail, String fullName) {
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>, welcome to QuestHive! Here's how to get started:")
                    + "<div style='background:#0f0f0f;border-radius:12px;padding:20px;margin:16px 0'>"
                    + "<div style='display:flex;flex-direction:column;gap:12px'>"
                    + stepItem("1", "#f5c518", "Join or create a group", "Your admin will send you an invite link, or create your own group from the dashboard.")
                    + stepItem("2", "#34d399", "Claim or get assigned tasks", "Browse open quests in your group and claim them, or wait for your admin to assign one.")
                    + stepItem("3", "#818cf8", "Complete tasks to earn coins &amp; XP", "Every completed quest earns you coins and XP. Stack your streak for bonus coins!")
                    + stepItem("4", "#f5c518", "Climb the leaderboard", "Weekly leaderboard resets every Monday. Top earner becomes the Quest Master 👑")
                    + "</div>"
                    + "</div>"
                    + para("Head to your dashboard to get started. Your hive is waiting! 🐝");
        sendEmail(toEmail, "Welcome to QuestHive! 🐝", baseTemplate("You're in the hive!", body));
    }

    private String stepItem(String num, String color, String title, String desc) {
        return "<div style='display:flex;gap:12px;align-items:flex-start;margin-bottom:12px'>"
             + "<div style='min-width:28px;height:28px;border-radius:50%;background:" + color + ";color:#000;"
             + "font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center'>" + num + "</div>"
             + "<div><div style='color:#fff;font-weight:700;font-size:13px;margin-bottom:2px'>" + title + "</div>"
             + "<div style='color:#888;font-size:12px;line-height:1.5'>" + desc + "</div></div>"
             + "</div>";
    }

    // ── Task Assigned ─────────────────────────────────────────────────────────
    @Async
    public void sendTaskAssignedNotification(String toEmail, String assignerName,
                                             String taskTitle, String priority, String deadline) {
        String priorityColor = "HIGH".equals(priority) ? "#ef4444" : "MEDIUM".equals(priority) ? "#f5c518" : "#34d399";
        String body = para("<strong style='color:#fff'>" + assignerName + "</strong> assigned you a new quest!")
                    + "<div style='background:#0f0f0f;border-radius:12px;padding:20px;margin:16px 0'>"
                    + "<div style='color:#888;font-size:12px;margin-bottom:4px'>TASK</div>"
                    + "<div style='color:#fff;font-size:16px;font-weight:700;margin-bottom:12px'>" + taskTitle + "</div>"
                    + "<div style='display:flex;gap:12px'>"
                    + "<span style='background:" + priorityColor + "22;color:" + priorityColor + ";border:1px solid " + priorityColor + "44;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700'>" + priority + "</span>"
                    + "<span style='color:#888;font-size:12px;padding:4px 0'>📅 Due: " + deadline + "</span>"
                    + "</div>"
                    + "</div>"
                    + para("Log in to QuestHive to view and start your task.");
        sendEmail(toEmail, "QuestHive — New Quest Assigned!", baseTemplate("New Quest for You!", body));
    }

    // ── Open Task Reminder ────────────────────────────────────────────────────
    @Async
    public void sendOpenTaskReminder(String toEmail, String taskTitle, String groupName) {
        String body = para("An open task in <strong style='color:#fff'>" + groupName + "</strong> has been unclaimed for 6 hours:")
                    + "<div style='background:#f5c51811;border:1px solid #f5c51844;border-radius:12px;padding:20px;margin:16px 0;text-align:center'>"
                    + "<div style='color:#f5c518;font-size:16px;font-weight:700'>" + taskTitle + "</div>"
                    + "</div>"
                    + para("⚠️ If nobody claims this in 2 more hours, <strong style='color:#ef4444'>all members will lose 5 coins</strong>. Log in and claim it now!");
        sendEmail(toEmail, "QuestHive — Open Task Needs Attention!", baseTemplate("Unclaimed Quest Alert", body));
    }

    // ── Open Task Final Warning ───────────────────────────────────────────────
    @Async
    public void sendOpenTaskFinalWarning(String toEmail, String taskTitle, String groupName) {
        String body = para("The open task <strong style='color:#fff'>" + taskTitle + "</strong> in group <strong style='color:#fff'>" + groupName + "</strong> was not claimed in time.")
                    + "<div style='background:#ef444411;border:1px solid #ef444444;border-radius:12px;padding:20px;margin:16px 0;text-align:center'>"
                    + "<div style='color:#ef4444;font-size:28px;font-weight:900'>-5 🪙</div>"
                    + "<div style='color:#ef4444;font-size:14px;margin-top:6px'>Coins deducted from your account</div>"
                    + "</div>"
                    + para("Stay on top of your quests to keep your coins safe!");
        sendEmail(toEmail, "QuestHive — Coins Deducted for Unclaimed Task", baseTemplate("Coins Deducted", body));
    }

    // ── Deadline Reminder ─────────────────────────────────────────────────────
    @Async
    public void sendDeadlineReminder(String toEmail, String taskTitle, String deadline) {
        String body = para("Your task is due soon — don't let your hive down!")
                    + "<div style='background:#0f0f0f;border-radius:12px;padding:20px;margin:16px 0'>"
                    + "<div style='color:#888;font-size:12px;margin-bottom:4px'>TASK</div>"
                    + "<div style='color:#fff;font-size:16px;font-weight:700;margin-bottom:8px'>" + taskTitle + "</div>"
                    + "<div style='color:#f5c518;font-size:13px'>📅 Due: " + deadline + "</div>"
                    + "</div>"
                    + para("Log in to QuestHive and mark it complete before time runs out.");
        sendEmail(toEmail, "QuestHive — Task Deadline Reminder!", baseTemplate("Quest Deadline Approaching", body));
    }

    // ── Recurring Task Suggestion ─────────────────────────────────────────────
    @Async
    public void sendRecurringTaskSuggestion(String toEmail, String taskTitle) {
        String body = para("You've completed the same type of task 3 days in a row:")
                    + "<div style='background:#0f0f0f;border-radius:12px;padding:20px;margin:16px 0;text-align:center'>"
                    + "<div style='color:#f5c518;font-size:16px;font-weight:700'>" + taskTitle + "</div>"
                    + "</div>"
                    + para("Consider making this a recurring quest. Log in to set it up and save time every day!");
        sendEmail(toEmail, "QuestHive — Make This a Recurring Task?", baseTemplate("Pattern Detected 🔁", body));
    }

    // ── Group Invite (code-based, kept for legacy) ────────────────────────────
    @Async
    public void sendGroupInvite(String toEmail, String groupName, String inviteCode) {
        String body = para("You've been invited to join <strong style='color:#fff'>" + groupName + "</strong> on QuestHive.")
                    + "<div style='background:#0f0f0f;border-radius:12px;padding:20px;margin:16px 0;text-align:center'>"
                    + "<p style='color:#888;font-size:12px;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:1px'>Invite Code</p>"
                    + "<div style='color:#f5c518;font-size:32px;font-weight:900;letter-spacing:8px'>" + inviteCode + "</div>"
                    + "</div>"
                    + para("Open QuestHive, go to Join Group, and enter the code above.");
        sendEmail(toEmail, "You're invited to join " + groupName + " on QuestHive!", baseTemplate("You're Invited! 🐝", body));
    }

    // ── Member Invite Link ────────────────────────────────────────────────────
    @Async
    public void sendMemberInviteLink(String toEmail, String groupName, String inviteLink) {
        String body = para("You've been invited to join <strong style='color:#fff'>" + groupName + "</strong> on QuestHive.")
                    + para("Click the button below to preview the group and create your account:")
                    + ctaButton("Join " + groupName, inviteLink)
                    + para("This link expires in <strong style='color:#f5c518'>48 hours</strong> and can only be used once.");
        sendEmail(toEmail, "You're invited to join " + groupName + " on QuestHive!", baseTemplate("You're Invited! 🐝", body));
    }

    // ── Admin Request Received ────────────────────────────────────────────────
    @Async
    public void sendAdminRequestReceived(String toEmail, String fullName) {
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>,")
                    + para("Your request to become a Family Admin on QuestHive has been received. You'll get an email as soon as it's reviewed by the Super Admin.");
        sendEmail(toEmail, "We received your QuestHive access request", baseTemplate("Request Received", body));
    }

    // ── Admin Request Approved ────────────────────────────────────────────────
    @Async
    public void sendAdminRequestApproved(String toEmail, String fullName, String registrationLink) {
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>,")
                    + para("Great news — your request to become a Family Admin on QuestHive has been <strong style='color:#34d399'>approved!</strong>")
                    + ctaButton("Complete Registration", registrationLink)
                    + para("This link expires in <strong style='color:#f5c518'>48 hours</strong>.");
        sendEmail(toEmail, "✅ Your QuestHive access has been approved!", baseTemplate("You're Approved!", body));
    }

    // ── Admin Request Rejected (with reason) ─────────────────────────────────
    @Async
    public void sendAdminRequestRejected(String toEmail, String fullName, String reason) {
        String reasonBlock = (reason != null && !reason.isBlank())
                ? "<div style='background:#ef444411;border:1px solid #ef444433;border-radius:10px;padding:16px;margin:16px 0'>"
                + "<div style='color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px'>Reason</div>"
                + "<div style='color:#f87171;font-size:13px;line-height:1.6'>" + reason + "</div>"
                + "</div>"
                : "";
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>,")
                    + para("After review, we're unable to approve your Family Admin request at this time.")
                    + reasonBlock
                    + para("If you think this is a mistake, please reach out to us.");
        sendEmail(toEmail, "Update on your QuestHive access request", baseTemplate("Request Update", body));
    }

    // ── Admin Request Notification to SuperAdmin ──────────────────────────────
    @Async
    public void sendAdminRequestNotification(String superAdminEmail, String requesterName,
                                             String requesterEmail, String reason) {
        String body = para("A new Family Admin access request has been submitted:")
                    + "<div style='background:#0f0f0f;border-radius:12px;padding:20px;margin:16px 0'>"
                    + "<div style='margin-bottom:10px'><span style='color:#888;font-size:12px'>Name: </span><span style='color:#fff;font-weight:600'>" + requesterName + "</span></div>"
                    + "<div style='margin-bottom:10px'><span style='color:#888;font-size:12px'>Email: </span><span style='color:#fff'>" + requesterEmail + "</span></div>"
                    + "<div><span style='color:#888;font-size:12px'>Reason: </span><span style='color:#ccc;font-style:italic'>" + reason + "</span></div>"
                    + "</div>"
                    + para("Log in to the Super Admin dashboard to approve or reject.");
        sendEmail(superAdminEmail, "🐝 New Family Admin Request — " + requesterName, baseTemplate("New Admin Request", body));
    }

    // ── Account Deactivated (with reason) ────────────────────────────────────
    public void sendAccountDeactivated(String toEmail, String fullName, String reason) {
        String reasonBlock = (reason != null && !reason.isBlank())
                ? "<div style='background:#ef444411;border:1px solid #ef444433;border-radius:10px;padding:16px;margin:16px 0'>"
                + "<div style='color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px'>Reason</div>"
                + "<div style='color:#f87171;font-size:13px;line-height:1.6'>" + reason + "</div>"
                + "</div>"
                : "";
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>,")
                    + para("Your QuestHive account has been <strong style='color:#ef4444'>deactivated</strong> by the Super Admin. You will not be able to log in until it is reactivated.")
                    + reasonBlock
                    + para("If you believe this is a mistake, please contact your administrator.");
        sendEmail(toEmail, "Your QuestHive account has been deactivated", baseTemplate("Account Deactivated", body));
    }

    // ── Member Deactivated in Group (with reason) ─────────────────────────────
    public void sendMemberDeactivatedInGroup(String toEmail, String fullName, String groupName, String reason) {
        String reasonBlock = (reason != null && !reason.isBlank())
                ? "<div style='background:#ef444411;border:1px solid #ef444433;border-radius:10px;padding:16px;margin:16px 0'>"
                + "<div style='color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px'>Reason</div>"
                + "<div style='color:#f87171;font-size:13px;line-height:1.6'>" + reason + "</div>"
                + "</div>"
                : "";
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>,")
                    + para("You have been <strong style='color:#ef4444'>deactivated</strong> in the group <strong style='color:#fff'>" + groupName + "</strong>. You will not be able to access this group until reactivated.")
                    + reasonBlock
                    + para("If you think this is a mistake, please contact your group admin.");
        sendEmail(toEmail, "QuestHive — You've been deactivated in " + groupName, baseTemplate("Group Access Suspended", body));
    }

    // ── Account Reactivated ───────────────────────────────────────────────────
    public void sendAccountReactivated(String toEmail, String fullName) {
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>,")
                    + para("Great news! Your QuestHive account has been <strong style='color:#34d399'>reactivated</strong>.")
                    + para("You can now log in and resume your quests. Welcome back! 🐝");
        sendEmail(toEmail, "Your QuestHive account has been reactivated", baseTemplate("Account Reactivated ✅", body));
    }

    // ── Weekly Digest ─────────────────────────────────────────────────────────
    @Async
    public void sendWeeklyDigest(String toEmail, String fullName, String groupName) {
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>, here's your weekly summary for <strong style='color:#f5c518'>" + groupName + "</strong>.")
                    + para("Log in to QuestHive to see your full stats, coins earned, and the Quest Master winner for this week!")
                    + para("Keep up the great work in your hive! 🐝");
        sendEmail(toEmail, "🐝 QuestHive Weekly Digest — " + groupName, baseTemplate("Your Weekly Digest", body));
    }

    // ── Group Inactivity Warning ──────────────────────────────────────────────
    @Async
    public void sendGroupInactivityWarning(String toEmail, String fullName, String groupName, int daysInactive) {
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>,")
                    + "<div style='background:#f5c51811;border:1px solid #f5c51844;border-radius:12px;padding:20px;margin:16px 0;text-align:center'>"
                    + "<div style='color:#f5c518;font-size:28px;font-weight:900'>" + daysInactive + " days</div>"
                    + "<div style='color:#888;font-size:13px;margin-top:6px'>" + groupName + " has been inactive</div>"
                    + "</div>"
                    + para("⚠️ Your group <strong style='color:#fff'>" + groupName + "</strong> will be <strong style='color:#ef4444'>automatically deleted in " + (30 - daysInactive) + " days</strong> if there is no activity.")
                    + para("Log in and assign or complete a task to keep your group alive!");
        sendEmail(toEmail, "QuestHive — " + groupName + " is inactive", baseTemplate("Group Inactivity Warning", body));
    }

    // ── Group Auto-Deleted ────────────────────────────────────────────────────
    @Async
    public void sendGroupAutoDeleted(String toEmail, String fullName, String groupName) {
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>,")
                    + para("Your group <strong style='color:#fff'>" + groupName + "</strong> has been <strong style='color:#ef4444'>automatically deleted</strong> due to 30 days of inactivity.")
                    + para("You can always create a new group on QuestHive whenever you're ready. 🐝");
        sendEmail(toEmail, "QuestHive — " + groupName + " has been deleted", baseTemplate("Group Deleted", body));
    }

    // ── Unverified Account 24h Reminder ──────────────────────────────────────
    @Async
    public void sendVerificationReminder(String toEmail, String fullName) {
        String body = para("Hi <strong style='color:#fff'>" + fullName + "</strong>,")
                    + "<div style='background:#ef444411;border:1px solid #ef444433;border-radius:12px;padding:20px;margin:16px 0;text-align:center'>"
                    + "<div style='color:#ef4444;font-size:14px;font-weight:700'>⚠️ Your account will be deleted in 24 hours</div>"
                    + "</div>"
                    + para("You signed up for QuestHive but haven't verified your email yet. Please verify before your account is automatically removed.")
                    + para("If you need a new verification link, log in and use the resend option.");
        sendEmail(toEmail, "QuestHive — Action Required: Verify Your Email", baseTemplate("Verify Your Email", body));
    }
    public void sendMemberRemoved(String toEmail, String memberName, String groupName, String adminName, String reason) {
        String subject = "You have been removed from " + groupName;
        String reasonHtml = (reason != null && !reason.isBlank())
            ? "<p style='margin:0 0 16px;font-size:14px;color:#ccc;'><strong style='color:#fff;'>Reason:</strong> " + reason + "</p>"
            : "";
        String html = baseTemplate("Removed from Group",
            "<p style='margin:0 0 12px;font-size:14px;color:#ccc;'>Hi <strong style='color:#fff;'>" + memberName + "</strong>,</p>"
            + "<p style='margin:0 0 16px;font-size:14px;color:#ccc;'>You have been removed from the group <strong style='color:#fff;'>" + groupName + "</strong> by <strong style='color:#fff;'>" + adminName + "</strong>.</p>"
            + reasonHtml
            + "<p style='margin:0;font-size:13px;color:#666;'>If you believe this was a mistake, please contact the group admin.</p>"
        );
        sendEmail(toEmail, subject, html);
    }

}
