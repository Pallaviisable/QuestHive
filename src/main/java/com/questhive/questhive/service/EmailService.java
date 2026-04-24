package com.questhive.questhive.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("QuestHive - Password Reset OTP");
        message.setText("Hello!\n\nYour OTP for resetting your QuestHive password is:\n\n🔑 " + otp +
                "\n\nThis OTP is valid for 10 minutes only.\n\nTeam QuestHive 🐝");
        mailSender.send(message);
    }

    public void sendSignupOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("QuestHive - Verify Your Email");
        message.setText("Welcome to QuestHive! 🐝\n\nPlease verify your email using the OTP below:\n\n🔑 " + otp +
                "\n\nThis OTP is valid for 10 minutes only.\n\nTeam QuestHive 🐝");
        mailSender.send(message);
    }

    public void sendEmailChangeOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("QuestHive - Verify Your New Email Address");
        message.setText("Hello!\n\nYou requested to change your email on QuestHive.\n\nVerification code: 🔑 " + otp +
                "\n\nValid for 10 minutes.\n\nTeam QuestHive 🐝");
        mailSender.send(message);
    }

    public void sendTaskAssignedNotification(String toEmail, String assignerName,
                                             String taskTitle, String priority, String deadline) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("QuestHive - New Task Assigned to You!");
        message.setText("Hello!\n\n" + assignerName + " has assigned you a new quest!\n\nTask: " + taskTitle +
                "\nPriority: " + priority + "\nDeadline: " + deadline +
                "\n\nLogin to QuestHive to view your tasks.\n\nTeam QuestHive 🐝");
        mailSender.send(message);
    }

    // ← NEW: open task 6-hour reminder
    public void sendOpenTaskReminder(String toEmail, String taskTitle, String groupName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("QuestHive - Open Task Needs Attention!");
        message.setText("Hello!\n\nAn open task in your group \"" + groupName + "\" has been unclaimed for 6 hours:\n\n" +
                "Task: " + taskTitle + "\n\n" +
                "Please log in and claim it. If nobody accepts within 2 more hours, all members will lose 5 coins.\n\n" +
                "Team QuestHive 🐝");
        mailSender.send(message);
    }

    // ← NEW: open task 8-hour final warning
    public void sendOpenTaskFinalWarning(String toEmail, String taskTitle, String groupName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("QuestHive - ⚠️ Coins Deducted for Unclaimed Task");
        message.setText("Hello!\n\nThe open task \"" + taskTitle + "\" in group \"" + groupName +
                "\" was not claimed in time.\n\n" +
                "5 coins have been deducted from your account.\n\n" +
                "Log in to QuestHive to stay on top of your tasks!\n\n" +
                "Team QuestHive 🐝");
        mailSender.send(message);
    }

    public void sendDeadlineReminder(String toEmail, String taskTitle, String deadline) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("QuestHive - Task Deadline Reminder!");
        message.setText("Hello!\n\nYour task is due soon!\n\nTask: " + taskTitle + "\nDeadline: " + deadline +
                "\n\nDon't let your hive down!\n\nTeam QuestHive 🐝");
        mailSender.send(message);
    }

    public void sendRecurringTaskSuggestion(String toEmail, String taskTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("QuestHive - Make This a Recurring Task?");
        message.setText("Hello!\n\nYou've been assigning the same task 3 days in a row!\n\nTask: " + taskTitle +
                "\n\nConsider making it recurring. Login to set it up!\n\nTeam QuestHive 🐝");
        mailSender.send(message);
    }

    public void sendGroupInvite(String toEmail, String groupName, String inviteCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("You're invited to join " + groupName + " on QuestHive!");
        message.setText("Hey there!\n\nYou've been invited to join \"" + groupName + "\" on QuestHive.\n\n" +
                "Invite code: " + inviteCode + "\n\nOpen QuestHive → Join Group → enter the code.\n\nSee you in the hive! 🐝");
        mailSender.send(message);
    }
}