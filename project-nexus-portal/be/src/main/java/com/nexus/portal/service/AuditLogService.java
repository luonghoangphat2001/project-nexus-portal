package com.nexus.portal.service;

import com.nexus.portal.dto.response.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AuditLogService {

    void log(Long userId, String username, String action, String resource, String details, String ipAddress, String userAgent, String status);

    Page<AuditLogResponse> getAuditLogs(String username, String action, String status, Pageable pageable);

    List<String> getDistinctActions();

    byte[] exportAuditLogsCsv(String username, String action, String status);
}
