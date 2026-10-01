package com.nexus.portal.service;

import com.nexus.portal.dto.request.SystemSettingUpdateRequest;
import com.nexus.portal.dto.response.SystemMetricsResponse;
import com.nexus.portal.dto.response.SystemSettingResponse;

import java.util.List;

public interface SystemSettingService {

    List<SystemSettingResponse> getAllSettings();

    SystemSettingResponse getSettingByKey(String key);

    SystemSettingResponse updateSetting(String key, SystemSettingUpdateRequest request, String updatedBy);

    SystemMetricsResponse getSystemMetrics();
}
