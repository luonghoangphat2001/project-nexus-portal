package com.nexus.portal.service;

import com.nexus.portal.dto.response.ResultStatisticsOptionsResponse;
import com.nexus.portal.dto.response.ResultStatisticsRowResponse;

import java.util.List;

public interface ResultStatisticsService {
    ResultStatisticsOptionsResponse getFilterOptions(String identifier);

    List<ResultStatisticsRowResponse> getStatistics(
            Long periodId, Long departmentId, Long topicId, String identifier);
}
