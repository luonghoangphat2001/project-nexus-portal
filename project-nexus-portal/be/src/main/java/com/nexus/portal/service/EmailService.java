package com.nexus.portal.service;

public interface EmailService {
    boolean isEnabled();
    boolean isConfigured();
    String getHost();
    int getPort();
    String getSender();

    void sendEmail(String to, String subject, String content);
    void sendHtmlEmail(String to, String subject, String htmlContent);
    void sendNotificationEmail(String to, String title, String content);
    boolean testConnection(String testRecipient);
}
