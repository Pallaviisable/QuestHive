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

            String body = "{"
                    + "\"sender\": {\"email\": \"" + senderEmail + "\", \"name\": \"QuestHive\"},"
                    + "\"to\": [{\"email\": \"" + toEmail + "\"}],"
                    + "\"subject\": \"" + subject + "\","
                    + "\"textContent\": \"" + textContent + "\""
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
}