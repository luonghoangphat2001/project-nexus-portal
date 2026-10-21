package com.nexus.portal.service;

import com.nexus.portal.dto.response.DashboardStatsResponse;

public interface DashboardService {
    DashboardStatsResponse getDashboardStats();
    DashboardStatsResponse getDashboardStats(String username);
}
