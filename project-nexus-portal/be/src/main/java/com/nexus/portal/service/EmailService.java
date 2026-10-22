package com.nexus.portal.service;

import com.nexus.portal.dto.response.EmailLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EmailService {
    boolean isEnabled();
    boolean isConfigured();
    String getHost();
    int getPort();
    String getSender();

    void sendEmail(String to, String subject, String content);
    void sendHtmlEmail(String to, String subject, String htmlContent);
    default void sendHtmlEmail(String to, String recipientName, String subject, String htmlContent, String templateName) {
        sendHtmlEmail(to, subject, htmlContent);
    }
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

    Page<EmailLogResponse> getEmailLogs(String search, String status, Pageable pageable);
    void clearEmailLogs();
}
