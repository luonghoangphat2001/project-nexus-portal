package com.nexus.portal.controller;

import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.AuditLogResponse;
import com.nexus.portal.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/audit-logs")
@Tag(name = "Security Audit Logs", description = "Endpoints for tracking user actions, security events, and audit logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Get paginated audit logs", description = "Filter logs by username, action, and status")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<AuditLogResponse> logs = auditLogService.getAuditLogs(username, action, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs, "Retrieved audit logs successfully"));
    }

    @GetMapping("/actions")
    @Operation(summary = "Get distinct action names", description = "Retrieve list of all unique action types recorded in audit logs")
    public ResponseEntity<ApiResponse<List<String>>> getDistinctActions() {
        List<String> actions = auditLogService.getDistinctActions();
        return ResponseEntity.ok(ApiResponse.success(actions, "Retrieved distinct audit actions"));
    }

    @GetMapping("/export")
    @Operation(summary = "Export audit logs to CSV", description = "Download filtered audit logs as a CSV file")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String status) {

        byte[] csvData = auditLogService.exportAuditLogsCsv(username, action, status);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-logs.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
