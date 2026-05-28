package com.questhive.questhive.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private void sendEmail(String toEmail, String subject, String textContent) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.set("api-key", brevoApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String safeBody = textContent.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
            String safeSubject = subject.replace("\"", "\\\"");
            String body = "{"
                    + "\"sender\": {\"email\": \"" + senderEmail + "\", \"name\": \"QuestHive\"},"
                    + "\"to\": [{\"email\": \"" + toEmail + "\"}],"
                    + "\"subject\": \"" + safeSubject + "\","
                    + "\"textContent\": \"" + safeBody + "\""
                    + "}";

            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, entity, String.class);
            System.out.println("EMAIL SUCCESS: Sent to " + toEmail + " | Status: " + response.getStatusCode());

        } catch (Exception e) {
            System.out.println("EMAIL FAILED: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Async
    public void sendOtp(String toEmail, String otp) {
        sendEmail(
                toEmail,
                "QuestHive - Password Reset OTP",
                "Hello!\\n\\nYour OTP for resetting your QuestHive password is:\\n\\n" + otp
                        + "\\n\\nThis OTP is valid for 10 minutes only.\\n\\nTeam QuestHive"
        );
    }

    @Async
    public void sendSignupOtp(String toEmail, String otp) {
        sendEmail(
                toEmail,
                "QuestHive - Verify Your Email",
                "Welcome to QuestHive!\\n\\nPlease verify your email using the OTP below:\\n\\n" + otp
                        + "\\n\\nThis OTP is valid for 10 minutes only.\\n\\nTeam QuestHive"
        );
    }

    @Async
    public void sendEmailChangeOtp(String toEmail, String otp) {
        sendEmail(
                toEmail,
                "QuestHive - Verify Your New Email Address",
                "Hello!\\n\\nYou requested to change your email on QuestHive.\\n\\nVerification code: " + otp
                        + "\\n\\nValid for 10 minutes.\\n\\nTeam QuestHive"
        );
    }

    @Async
    public void sendTaskAssignedNotification(String toEmail, String assignerName,
                                             String taskTitle, String priority, String deadline) {
        sendEmail(
                toEmail,
                "QuestHive - New Task Assigned to You!",
                "Hello!\\n\\n" + assignerName + " has assigned you a new quest!\\n\\nTask: " + taskTitle
                        + "\\nPriority: " + priority + "\\nDeadline: " + deadline
                        + "\\n\\nLogin to QuestHive to view your tasks.\\n\\nTeam QuestHive"
        );
    }

    @Async
    public void sendOpenTaskReminder(String toEmail, String taskTitle, String groupName) {
        sendEmail(
                toEmail,
                "QuestHive - Open Task Needs Attention!",
                "Hello!\\n\\nAn open task in your group " + groupName + " has been unclaimed for 6 hours:\\n\\n"
                        + "Task: " + taskTitle + "\\n\\n"
                        + "Please log in and claim it. If nobody accepts within 2 more hours, all members will lose 5 coins.\\n\\n"
                        + "Team QuestHive"
        );
    }

    @Async
    public void sendOpenTaskFinalWarning(String toEmail, String taskTitle, String groupName) {
        sendEmail(
                toEmail,
                "QuestHive - Coins Deducted for Unclaimed Task",
                "Hello!\\n\\nThe open task " + taskTitle + " in group " + groupName
                        + " was not claimed in time.\\n\\n"
                        + "5 coins have been deducted from your account.\\n\\n"
                        + "Log in to QuestHive to stay on top of your tasks!\\n\\nTeam QuestHive"
        );
    }

    @Async
    public void sendDeadlineReminder(String toEmail, String taskTitle, String deadline) {
        sendEmail(
                toEmail,
                "QuestHive - Task Deadline Reminder!",
                "Hello!\\n\\nYour task is due soon!\\n\\nTask: " + taskTitle + "\\nDeadline: " + deadline
                        + "\\n\\nDon't let your hive down!\\n\\nTeam QuestHive"
        );
    }

    @Async
    public void sendRecurringTaskSuggestion(String toEmail, String taskTitle) {
        sendEmail(
                toEmail,
                "QuestHive - Make This a Recurring Task?",
                "Hello!\\n\\nYou've been assigning the same task 3 days in a row!\\n\\nTask: " + taskTitle
                        + "\\n\\nConsider making it recurring. Login to set it up!\\n\\nTeam QuestHive"
        );
    }

    @Async
    public void sendGroupInvite(String toEmail, String groupName, String inviteCode) {
        sendEmail(
                toEmail,
                "You're invited to join " + groupName + " on QuestHive!",
                "Hey there!\\n\\nYou've been invited to join " + groupName + " on QuestHive.\\n\\n"
                        + "Invite code: " + inviteCode + "\\n\\nOpen QuestHive, go to Join Group, and enter the code.\\n\\nSee you in the hive!"
        );
    }

    @Async
    public void sendMemberInviteLink(String toEmail, String groupName, String inviteLink) {
        String subject = "You're invited to join " + groupName + " on QuestHive!";
        String body = "Hi there!\n\n"
                + "You've been invited to join the group \"" + groupName + "\" on QuestHive 🐝\n\n"
                + "Click the link below to preview the group and create your account:\n"
                + inviteLink + "\n\n"
                + "This link expires in 48 hours and can only be used once.\n\n"
                + "— The QuestHive Team";
        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendAdminRequestReceived(String toEmail, String fullName) {
        String subject = "We received your QuestHive access request";
        String body = "Hi " + fullName + ",\n\n"
                + "Your request to become a Family Admin on QuestHive has been received.\n"
                + "You'll get an email as soon as it's reviewed.\n\n"
                + "— The QuestHive Team";
        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendAdminRequestApproved(String toEmail, String fullName, String registrationLink) {
        String subject = "✅ Your QuestHive access has been approved!";
        String body = "Hi " + fullName + ",\n\n"
                + "Great news — your request to become a Family Admin on QuestHive has been approved!\n\n"
                + "Click the link below to complete your registration:\n"
                + registrationLink + "\n\n"
                + "This link expires in 48 hours.\n\n"
                + "— The QuestHive Team";
        sendEmail(toEmail, subject, body);
    }

    @Async
    public void sendAdminRequestRejected(String toEmail, String fullName) {
        String subject = "Update on your QuestHive access request";
        String body = "Hi " + fullName + ",\n\n"
                + "After review, we're unable to approve your Family Admin request at this time.\n\n"
                + "If you think this is a mistake, please reach out to us.\n\n"
                + "— The QuestHive Team";
        sendEmail(toEmail, subject, body);
    }
    @Async
    public void sendAdminRequestNotification(String superAdminEmail, String requesterName,
                                            String requesterEmail, String reason) {
        String subject = "🐝 New Family Admin Request — " + requesterName;
        String body = "New admin access request received:\n\n"
                + "Name: " + requesterName + "\n"
                + "Email: " + requesterEmail + "\n"
                + "Reason: " + reason + "\n\n"
                + "Login to the Super Admin dashboard to review.";
        sendEmail(superAdminEmail, subject, body);
    }
    @Async
    public void sendWelcomeEmail(String toEmail, String fullName) {
        String subject = "Welcome to QuestHive! 🐝";
        String body = "Hi " + fullName + "!\n\n"
                + "Welcome to QuestHive. Your account is all set.\n\n"
                + "Complete quests, earn coins, climb the leaderboard, and make your hive unstoppable.\n\n"
                + "— The QuestHive Team";
        sendEmail(toEmail, subject, body);
    }
    

    @Async
    public void sendWeeklyDigest(String toEmail, String fullName, String groupName) {
        String subject = "🐝 QuestHive Weekly Digest — " + groupName;
        String body = "Hi " + fullName + ",\n\n"
                + "Here's your weekly summary for " + groupName + ".\n\n"
                + "Log in to QuestHive to see your full stats, coins earned, and the Quest Master winner!\n\n"
                + "Keep up the great work in your hive! 🐝\n\n"
                + "— The QuestHive Team";
        sendEmail(toEmail, subject, body);
    }

    public void sendAccountDeactivated(String toEmail, String fullName) {
        String subject = "Your QuestHive account has been deactivated";
        String body = "Hi " + fullName + ",\n\n"
                + "Your QuestHive account has been deactivated by the Super Admin.\n"
                + "You will not be able to log in until your account is reactivated.\n\n"
                + "If you believe this is a mistake, please contact your administrator.\n\n"
                + "— The QuestHive Team";
        sendEmail(toEmail, subject, body);
    }

    public void sendAccountReactivated(String toEmail, String fullName) {
        String subject = "Your QuestHive account has been reactivated";
        String body = "Hi " + fullName + ",\n\n"
                + "Great news! Your QuestHive account has been reactivated.\n"
                + "You can now log in and resume your quests.\n\n"
                + "— The QuestHive Team";
        sendEmail(toEmail, subject, body);
    }
}
