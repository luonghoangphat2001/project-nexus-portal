package com.nexus.portal.controller;

import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.DashboardStatsResponse;
import com.nexus.portal.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@Tag(name = "Dashboard Analytics", description = "Endpoints for platform metrics, KPI totals, and user distribution data")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get dashboard analytics overview", description = "Returns system KPIs including total users, active users, active rate, role distribution, and monthly registration trends.")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        DashboardStatsResponse stats = dashboardService.getDashboardStats(username);
        return ResponseEntity.ok(ApiResponse.success(stats, "Retrieved dashboard statistics successfully"));
    }
}

