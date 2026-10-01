package com.nexus.portal.controller;

import com.nexus.portal.dto.request.SystemSettingUpdateRequest;
import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.SystemMetricsResponse;
import com.nexus.portal.dto.response.SystemSettingResponse;
import com.nexus.portal.service.SystemSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@Tag(name = "System Administration", description = "Endpoints for managing system settings, configurations, and health metrics")
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    public SystemSettingController(SystemSettingService systemSettingService) {
        this.systemSettingService = systemSettingService;
    }

    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Get all system settings", description = "Retrieve list of all active system configuration parameters")
    public ResponseEntity<ApiResponse<List<SystemSettingResponse>>> getAllSettings() {
        List<SystemSettingResponse> settings = systemSettingService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.success(settings, "Retrieved system settings successfully"));
    }

    @GetMapping("/settings/{key}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Get system setting by key", description = "Retrieve a specific system setting by its unique key")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> getSettingByKey(@PathVariable String key) {
        SystemSettingResponse setting = systemSettingService.getSettingByKey(key);
        return ResponseEntity.ok(ApiResponse.success(setting, "Retrieved setting"));
    }

    @PutMapping("/settings/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update system setting", description = "Requires ADMIN role. Update the value or description of a system setting")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody SystemSettingUpdateRequest request,
            Authentication authentication) {
        String updatedBy = authentication != null ? authentication.getName() : "ADMIN";
        SystemSettingResponse updated = systemSettingService.updateSetting(key, request, updatedBy);
        return ResponseEntity.ok(ApiResponse.success(updated, "System setting updated successfully"));
    }

    @GetMapping("/system/metrics")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Get system health & metrics", description = "Retrieve JVM memory, database status, entity counts, and runtime metrics")
    public ResponseEntity<ApiResponse<SystemMetricsResponse>> getSystemMetrics() {
        SystemMetricsResponse metrics = systemSettingService.getSystemMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics, "Retrieved system metrics successfully"));
    }
}
