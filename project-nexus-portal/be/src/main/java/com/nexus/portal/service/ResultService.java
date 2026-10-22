package com.nexus.portal.service;

import com.nexus.portal.dto.response.ResultResponse;

import java.util.List;

public interface ResultService {
    List<ResultResponse.Defense> publishAssignmentResults(Long assignmentId, String identifier);

    List<ResultResponse.Defense> republishAssignmentResults(Long assignmentId, String reason, String identifier);

    List<ResultResponse.Defense> publishPeriodResults(Long periodId, String identifier);

    List<ResultResponse.Defense> getMyPublishedResults(String identifier);

    ResultResponse.Statistics.Options getFilterOptions(String identifier);

    List<ResultResponse.Statistics.Row> getStatistics(
            Long periodId, Long departmentId, Long topicId, String identifier);

    List<ResultResponse.Statistics.DetailRow> getDetailedReport(
            Long periodId, Long departmentId, Long topicId, String identifier);
}
