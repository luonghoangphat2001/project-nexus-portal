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
    default void sendNotificationEmail(String to, String recipientName, String title, String content) {
        sendNotificationEmail(to, recipientName, title, content, "vi");
    }
    default void sendNotificationEmail(String to, String recipientName, String title, String content, String lang) {
        sendNotificationEmail(to, title, content);
    }
    boolean testConnection(String testRecipient);
    default boolean testConnection(String testRecipient, String lang) {
        return testConnection(testRecipient);
    }
}
