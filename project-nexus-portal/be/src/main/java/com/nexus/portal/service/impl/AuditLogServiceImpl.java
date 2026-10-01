package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.AuditLogResponse;
import com.nexus.portal.model.AuditLog;
import com.nexus.portal.repository.AuditLogRepository;
import com.nexus.portal.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public void log(Long userId, String username, String action, String resource, String details, String ipAddress, String userAgent, String status) {
        try {
            AuditLog auditLog = new AuditLog(userId, username, action, resource, details, ipAddress, userAgent, status);
            auditLogRepository.save(auditLog);
        } catch (Exception ignored) {
            // Audit logging should not crash the main business transaction
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(String username, String action, String status, Pageable pageable) {
        String queryUsername = (username != null && !username.trim().isEmpty()) ? username.trim() : null;
        String queryAction = (action != null && !action.trim().isEmpty() && !action.equalsIgnoreCase("ALL")) ? action.trim() : null;
        String queryStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;

        return auditLogRepository.findWithFilters(queryUsername, queryAction, queryStatus, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDistinctActions() {
        return auditLogRepository.findDistinctActions();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAuditLogsCsv(String username, String action, String status) {
        String queryUsername = (username != null && !username.trim().isEmpty()) ? username.trim() : null;
        String queryAction = (action != null && !action.trim().isEmpty() && !action.equalsIgnoreCase("ALL")) ? action.trim() : null;
        String queryStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;

        List<AuditLog> logs = auditLogRepository.findAll();

        StringBuilder csv = new StringBuilder();
        // UTF-8 BOM for Excel compatibility
        csv.append('\ufeff');
        csv.append("ID,Timestamp,Username,Action,Resource,Status,IP Address,Details\n");

        for (AuditLog log : logs) {
            if (queryUsername != null && (log.getUsername() == null || !log.getUsername().toLowerCase().contains(queryUsername.toLowerCase()))) {
                continue;
            }
            if (queryAction != null && (log.getAction() == null || !log.getAction().equalsIgnoreCase(queryAction))) {
                continue;
            }
            if (queryStatus != null && (log.getStatus() == null || !log.getStatus().equalsIgnoreCase(queryStatus))) {
                continue;
            }

            csv.append(log.getId()).append(",")
                    .append(log.getCreatedAt() != null ? log.getCreatedAt().format(FORMATTER) : "").append(",")
                    .append(escapeCsv(log.getUsername())).append(",")
                    .append(escapeCsv(log.getAction())).append(",")
                    .append(escapeCsv(log.getResource())).append(",")
                    .append(escapeCsv(log.getStatus())).append(",")
                    .append(escapeCsv(log.getIpAddress())).append(",")
                    .append(escapeCsv(log.getDetails()))
                    .append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUserId(),
                log.getUsername(),
                log.getAction(),
                log.getResource(),
                log.getDetails(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getStatus(),
                log.getCreatedAt()
        );
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
