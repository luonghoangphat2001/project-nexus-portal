package com.nexus.portal.service;

import com.nexus.portal.dto.response.ResultResponse;

import java.util.List;

public interface ResultStatisticsService {
    ResultResponse.Statistics.Options getFilterOptions(String identifier);

    List<ResultResponse.Statistics.Row> getStatistics(
            Long periodId, Long departmentId, Long topicId, String identifier);
}
