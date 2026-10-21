package com.nexus.portal.service.impl;

import com.nexus.portal.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Year;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final Map<String, String> templateCache = new ConcurrentHashMap<>();

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from:noreply@nexus.edu.vn}")
    private String fromEmail;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${app.mail.frontend-url:${APP_FRONTEND_URL:${FRONTEND_URL:http://localhost:5173}}}")
    private String frontendUrl;

    public EmailServiceImpl(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public boolean isConfigured() {
        return username != null && !username.trim().isEmpty() && mailSender != null;
    }

    @Override
    public String getHost() {
        return host;
    }

    @Override
    public int getPort() {
        return port;
    }

    @Override
    public String getSender() {
        if (fromEmail != null && !fromEmail.isBlank() && !fromEmail.equalsIgnoreCase("noreply@nexus.edu.vn")) {
            return fromEmail.trim();
        }
        if (username != null && !username.isBlank()) {
            return username.trim();
        }
        return fromEmail != null && !fromEmail.isBlank() ? fromEmail.trim() : "noreply@nexus.edu.vn";
    }

    @Async
    @Override
    public void sendEmail(String to, String subject, String content) {
        if (to == null || to.trim().isEmpty()) {
            return;
        }

        if (!enabled || !isConfigured()) {
            log.info("[MOCK-EMAIL] To: {} | Subject: {} | Content: {}", to, subject, content);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getSender());
            message.setTo(to.trim());
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("[EMAIL-SENT] Successfully delivered email to {}", to);
        } catch (Exception e) {
            log.error("[EMAIL-ERROR] Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        if (to == null || to.trim().isEmpty()) {
            return;
        }

        if (!enabled || !isConfigured()) {
            log.info("[MOCK-HTML-EMAIL] To: {} | Subject: {} | HTML Size: {} bytes", to, subject, htmlContent.length());
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());
            try {
                helper.setFrom(getSender(), "Nexus Portal");
            } catch (Exception ignored) {
                helper.setFrom(getSender());
            }
            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            log.info("[EMAIL-SENT] Successfully delivered HTML email to {}", to);
        } catch (Exception e) {
            log.error("[EMAIL-ERROR] Failed to send HTML email to {}: {}", to, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void sendNotificationEmail(String to, String title, String content) {
        String templateName = resolveTemplateName(title);
        String systemUrl = resolveSystemUrl();
        String currentYear = String.valueOf(Year.now().getValue());

        String template = loadTemplate(templateName);
        String html = template
                .replace("{{TITLE}}", title)
                .replace("{{CONTENT}}", content.replace("\n", "<br/>"))
                .replace("{{RECIPIENT_NAME}}", to.contains("@") ? to.substring(0, to.indexOf('@')) : to)
                .replace("{{SYSTEM_URL}}", systemUrl)
                .replace("{{YEAR}}", currentYear);

        sendHtmlEmail(to, "[Nexus Portal] " + title, html);
    }

    private String resolveTemplateName(String title) {
        if (title == null) return "notification-template";
        String lower = title.toLowerCase();
        if (lower.contains("đề tài") || lower.contains("topic")) {
            return "topic-status";
        }
        return "notification-template";
    }

    private String resolveSystemUrl() {
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            return frontendUrl.trim();
        }
        return "http://localhost:5173";
    }

    /**
     * Loads the email template from classpath:templates/email/{templateName}.html
     */
    private String loadTemplate(String templateName) {
        return templateCache.computeIfAbsent(templateName, name -> {
            try {
                ClassPathResource resource = new ClassPathResource("templates/email/" + name + ".html");
                if (resource.exists()) {
                    try (InputStream is = resource.getInputStream()) {
                        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    }
                }
                // Fallback to default template if specific template doesn't exist
                ClassPathResource defaultRes = new ClassPathResource("templates/email/notification-template.html");
                if (defaultRes.exists()) {
                    try (InputStream is = defaultRes.getInputStream()) {
                        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    }
                }
            } catch (Exception e) {
                log.warn("[EMAIL-TEMPLATE] Failed to load template {}: {}", name, e.getMessage());
            }

            // Built-in emergency fallback if template files are missing
            return """
                <!DOCTYPE html><html><body>
                <h2>{{TITLE}}</h2>
                <div>{{CONTENT}}</div>
                <p><a href="{{SYSTEM_URL}}">Mở Nexus Portal</a></p>
                <hr><small>&copy; {{YEAR}} Nexus Portal</small>
                </body></html>
                """;
        });
    }

    @Override
    public boolean testConnection(String testRecipient) {
        if (!isConfigured()) {
            log.info("[MOCK-EMAIL-TEST] Test email requested for {}, but SMTP credentials are not configured yet.", testRecipient);
            return true;
        }

        try {
            String title = "Kiểm tra kết nối SMTP Email thành công";
            String templateName = resolveTemplateName(title);
            String systemUrl = resolveSystemUrl();
            String currentYear = String.valueOf(Year.now().getValue());

            String template = loadTemplate(templateName);
            String html = template
                    .replace("{{TITLE}}", title)
                    .replace("{{CONTENT}}", "Xin chào,<br/><br/>Đây là email kiểm tra kết nối SMTP từ Cổng Thông Tin Khóa Luận Tốt Nghiệp (Nexus Portal).<br/>Hệ thống đã kết nối và gửi email thành công qua máy chủ SMTP Gmail!<br/><br/>Trân trọng,<br/>Ban Quản Trị Khoa CNTT.")
                    .replace("{{RECIPIENT_NAME}}", testRecipient.contains("@") ? testRecipient.substring(0, testRecipient.indexOf('@')) : testRecipient)
                    .replace("{{SYSTEM_URL}}", systemUrl)
                    .replace("{{YEAR}}", currentYear);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());
            try {
                helper.setFrom(getSender(), "Nexus Portal");
            } catch (Exception ignored) {
                helper.setFrom(getSender());
            }
            helper.setTo(testRecipient.trim());
            helper.setSubject("[Nexus Portal] " + title);
            helper.setText(html, true);
            mailSender.send(mimeMessage);
            log.info("[EMAIL-TEST-SUCCESS] Delivered test email directly to {}", testRecipient);
            return true;
        } catch (Exception e) {
            log.error("[EMAIL-TEST-FAILED] SMTP test failed: {}", e.getMessage(), e);
            throw new RuntimeException("SMTP Connection failed: " + e.getMessage(), e);
        }
    }
}
