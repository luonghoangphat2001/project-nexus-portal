package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.EmailLogResponse;
import com.nexus.portal.model.EmailLog;
import com.nexus.portal.repository.EmailLogRepository;
import com.nexus.portal.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final EmailLogRepository emailLogRepository;
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

    public EmailServiceImpl(@Autowired(required = false) JavaMailSender mailSender,
                            @Autowired(required = false) EmailLogRepository emailLogRepository) {
        this.mailSender = mailSender;
        this.emailLogRepository = emailLogRepository;
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

    private void recordEmailLog(String to, String recipientName, String subject, String templateName, String status, String errorMessage) {
        if (emailLogRepository == null || to == null) {
            return;
        }
        try {
            EmailLog logEntity = new EmailLog(
                    to.trim(),
                    recipientName != null ? recipientName.trim() : null,
                    getSender(),
                    subject != null ? subject.trim() : "No Subject",
                    templateName,
                    status,
                    errorMessage
            );
            emailLogRepository.save(logEntity);
        } catch (Exception ex) {
            log.warn("[EMAIL-LOG-RECORD-FAILED] Could not record email log: {}", ex.getMessage());
        }
    }

    @Async
    @Override
    public void sendEmail(String to, String subject, String content) {
        if (to == null || to.trim().isEmpty()) {
            return;
        }

        if (!enabled || !isConfigured()) {
            log.info("[MOCK-EMAIL] To: {} | Subject: {} | Content: {}", to, subject, content);
            recordEmailLog(to, null, subject, "plain-text", "MOCK", null);
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
            recordEmailLog(to, null, subject, "plain-text", "SENT", null);
        } catch (Exception e) {
            log.error("[EMAIL-ERROR] Failed to send email to {}: {}", to, e.getMessage(), e);
            recordEmailLog(to, null, subject, "plain-text", "FAILED", e.getMessage());
        }
    }

    @Async
    @Override
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        sendHtmlEmail(to, null, subject, htmlContent, "custom_html");
    }

    @Async
    @Override
    public void sendHtmlEmail(String to, String recipientName, String subject, String htmlContent, String templateName) {
        if (to == null || to.trim().isEmpty()) {
            return;
        }

        if (!enabled || !isConfigured()) {
            log.info("[MOCK-HTML-EMAIL] To: {} | Subject: {} | HTML Size: {} bytes", to, subject, htmlContent != null ? htmlContent.length() : 0);
            recordEmailLog(to, recipientName, subject, templateName, "MOCK", null);
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
            recordEmailLog(to, recipientName, subject, templateName, "SENT", null);
        } catch (Exception e) {
            log.error("[EMAIL-ERROR] Failed to send HTML email to {}: {}", to, e.getMessage(), e);
            recordEmailLog(to, recipientName, subject, templateName, "FAILED", e.getMessage());
        }
    }

    @Async
    @Override
    public void sendNotificationEmail(String to, String title, String content) {
        sendNotificationEmail(to, null, title, content, "vi");
    }

    @Async
    @Override
    public void sendNotificationEmail(String to, String recipientName, String title, String content) {
        sendNotificationEmail(to, recipientName, title, content, "vi");
    }

    @Async
    @Override
    public void sendNotificationEmail(String to, String recipientName, String title, String content, String lang) {
        if (to == null || to.trim().isEmpty()) {
            return;
        }

        String safeLang = (lang != null && lang.trim().toLowerCase().startsWith("en")) ? "en" : "vi";
        String localizedTitle = extractLocalized(title, safeLang);
        String localizedContent = extractLocalized(content, safeLang);

        String templateName = resolveTemplateName(localizedTitle != null && !localizedTitle.isBlank() ? localizedTitle : title);
        String systemUrl = resolveSystemUrl();
        String currentYear = String.valueOf(Year.now().getValue());

        String displayName = (recipientName != null && !recipientName.isBlank())
                ? recipientName.trim()
                : (to.contains("@") ? to.substring(0, to.indexOf('@')) : to);

        String template = loadTemplate(templateName, safeLang);
        String html = template
                .replace("{{TITLE}}", localizedTitle)
                .replace("{{CONTENT}}", localizedContent.replace("\n", "<br/>"))
                .replace("{{RECIPIENT_NAME}}", displayName)
                .replace("{{SYSTEM_URL}}", systemUrl)
                .replace("{{YEAR}}", currentYear);

        sendHtmlEmail(to, displayName, "[Nexus Portal] " + localizedTitle, html, templateName);
    }

    /**
     * Extracts localized text (either "vi" or "en") from bilingual formatted text.
     * Handles formats:
     * 1. Pipe format: "[VI] <vi_title> | [EN] <en_title>"
     * 2. Tagged block format: "[VI] <vi_content>\n[EN] <en_content>"
     */
    public static String extractLocalized(String text, String lang) {
        if (text == null || text.isBlank()) {
            return "";
        }

        String trimmed = text.trim();
        boolean isEn = (lang != null && lang.trim().toLowerCase().startsWith("en"));

        // 1. Pipe format: "[VI] ... | [EN] ..."
        Pattern titlePipePattern = Pattern.compile("^\\[VI\\]\\s*(.*?)\\s*\\|\\s*\\[EN\\]\\s*(.*?)$", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
        Matcher pipeMatcher = titlePipePattern.matcher(trimmed);
        if (pipeMatcher.matches()) {
            String selected = isEn ? pipeMatcher.group(2).trim() : pipeMatcher.group(1).trim();
            if (!selected.isEmpty()) {
                return selected;
            }
        }

        // 2. Tagged block format: "[VI] ... [EN] ..."
        if (isEn) {
            Pattern enPattern = Pattern.compile("\\[EN\\]\\s*([\\s\\S]*?)(?=(\\r?\\n\\s*\\[VI\\]|\\[VI\\]|$))", Pattern.CASE_INSENSITIVE);
            Matcher enMatcher = enPattern.matcher(trimmed);
            if (enMatcher.find()) {
                String en = enMatcher.group(1).trim();
                if (!en.isEmpty()) {
                    return en;
                }
            }
            if (trimmed.toUpperCase().startsWith("[EN]")) {
                String stripped = trimmed.substring(4).trim();
                int viIndex = stripped.toUpperCase().indexOf("[VI]");
                if (viIndex >= 0) {
                    stripped = stripped.substring(0, viIndex).trim();
                }
                if (!stripped.isEmpty()) {
                    return stripped;
                }
            }
        } else {
            Pattern viPattern = Pattern.compile("\\[VI\\]\\s*([\\s\\S]*?)(?=(\\r?\\n\\s*\\[EN\\]|\\[EN\\]|$))", Pattern.CASE_INSENSITIVE);
            Matcher viMatcher = viPattern.matcher(trimmed);
            if (viMatcher.find()) {
                String vi = viMatcher.group(1).trim();
                if (!vi.isEmpty()) {
                    return vi;
                }
            }
            if (trimmed.toUpperCase().startsWith("[VI]")) {
                String stripped = trimmed.substring(4).trim();
                int enIndex = stripped.toUpperCase().indexOf("[EN]");
                if (enIndex >= 0) {
                    stripped = stripped.substring(0, enIndex).trim();
                }
                if (!stripped.isEmpty()) {
                    return stripped;
                }
            }
        }

        // 3. Fallback: If requested EN was not found, try extracting VI; or vice versa
        if (isEn) {
            int viIdx = trimmed.toUpperCase().indexOf("[VI]");
            if (viIdx >= 0) {
                String fallbackVi = extractLocalized(trimmed, "vi");
                if (!fallbackVi.isEmpty()) return fallbackVi;
            }
        } else {
            int enIdx = trimmed.toUpperCase().indexOf("[EN]");
            if (enIdx >= 0) {
                String before = trimmed.substring(0, enIdx).trim();
                if (before.toUpperCase().startsWith("[VI]")) {
                    before = before.substring(4).trim();
                }
                if (!before.isEmpty()) {
                    return before;
                }
            }
        }

        return trimmed.replaceAll("(?i)^\\[(VI|EN)\\]\\s*", "").trim();
    }

    public static String extractVietnamese(String text) {
        return extractLocalized(text, "vi");
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
     * Loads the email template from classpath:templates/email/{lang}/{templateName}.html
     */
    private String loadTemplate(String templateName, String lang) {
        String safeLang = ("en".equalsIgnoreCase(lang)) ? "en" : "vi";
        String cacheKey = safeLang + "/" + templateName;
        return templateCache.computeIfAbsent(cacheKey, key -> {
            try {
                // 1. Primary: classpath:templates/email/{lang}/{templateName}.html
                ClassPathResource resource = new ClassPathResource("templates/email/" + key + ".html");
                if (resource.exists()) {
                    try (InputStream is = resource.getInputStream()) {
                        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    }
                }
                // 2. Fallback: classpath:templates/email/{templateName}.html
                ClassPathResource baseRes = new ClassPathResource("templates/email/" + templateName + ".html");
                if (baseRes.exists()) {
                    try (InputStream is = baseRes.getInputStream()) {
                        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    }
                }
                // 3. Fallback: classpath:templates/email/{lang}/notification-template.html
                ClassPathResource langDefaultRes = new ClassPathResource("templates/email/" + safeLang + "/notification-template.html");
                if (langDefaultRes.exists()) {
                    try (InputStream is = langDefaultRes.getInputStream()) {
                        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    }
                }
                // 4. Fallback: classpath:templates/email/notification-template.html
                ClassPathResource defaultRes = new ClassPathResource("templates/email/notification-template.html");
                if (defaultRes.exists()) {
                    try (InputStream is = defaultRes.getInputStream()) {
                        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    }
                }
            } catch (Exception e) {
                log.warn("[EMAIL-TEMPLATE] Failed to load template {}: {}", key, e.getMessage());
            }

            return "";
        });
    }

    @Override
    public boolean testConnection(String testRecipient) {
        return testConnection(testRecipient, "vi");
    }

    @Override
    public boolean testConnection(String testRecipient, String lang) {
        String safeLang = ("en".equalsIgnoreCase(lang)) ? "en" : "vi";
        String displayName = (testRecipient != null && testRecipient.contains("@"))
                ? testRecipient.substring(0, testRecipient.indexOf('@'))
                : (testRecipient != null ? testRecipient : "");
        String subject = "en".equals(safeLang)
                ? "[Nexus Portal] SMTP Email Connection Test Successful"
                : "[Nexus Portal] Kiểm tra kết nối SMTP Email thành công";

        if (!isConfigured()) {
            log.info("[MOCK-EMAIL-TEST] Test email requested for {}, but SMTP credentials are not configured yet.", testRecipient);
            recordEmailLog(testRecipient, displayName, subject, "test-connection", "MOCK", null);
            return true;
        }

        try {
            String systemUrl = resolveSystemUrl();
            String currentYear = String.valueOf(Year.now().getValue());

            String template = loadTemplate("test-connection", safeLang);
            String html = template
                    .replace("{{RECIPIENT_NAME}}", displayName)
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
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(mimeMessage);
            log.info("[EMAIL-TEST-SUCCESS] Delivered test email to {} in language {}", testRecipient, safeLang);
            recordEmailLog(testRecipient, displayName, subject, "test-connection", "SENT", null);
            return true;
        } catch (Exception e) {
            log.error("[EMAIL-TEST-FAILED] SMTP test failed: {}", e.getMessage(), e);
            recordEmailLog(testRecipient, displayName, subject, "test-connection", "FAILED", e.getMessage());
            throw new RuntimeException("SMTP Connection failed: " + e.getMessage(), e);
        }
    }

    @Override
    public Page<EmailLogResponse> getEmailLogs(String search, String status, Pageable pageable) {
        if (emailLogRepository == null) {
            return Page.empty(pageable);
        }
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim()))
                ? status.trim().toUpperCase() : null;
        return emailLogRepository.findWithFilters(cleanSearch, cleanStatus, pageable)
                .map(this::mapToLogResponse);
    }

    @Override
    public void clearEmailLogs() {
        if (emailLogRepository != null) {
            emailLogRepository.deleteAll();
        }
    }

    private EmailLogResponse mapToLogResponse(EmailLog logEntity) {
        return new EmailLogResponse(
                logEntity.getId(),
                logEntity.getRecipient(),
                logEntity.getRecipientName(),
                logEntity.getSender(),
                logEntity.getSubject(),
                logEntity.getTemplateName(),
                logEntity.getStatus(),
                logEntity.getErrorMessage(),
                logEntity.getCreatedAt()
        );
    }
}
