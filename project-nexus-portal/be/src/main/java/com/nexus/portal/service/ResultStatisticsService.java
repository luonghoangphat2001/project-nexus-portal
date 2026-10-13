package com.nexus.portal.service;

import com.nexus.portal.dto.response.ResultStatisticsResponse;

import java.util.List;

public interface ResultStatisticsService {
    ResultStatisticsResponse.Options getFilterOptions(String identifier);

    List<ResultStatisticsResponse.Row> getStatistics(
            Long periodId, Long departmentId, Long topicId, String identifier);
}
