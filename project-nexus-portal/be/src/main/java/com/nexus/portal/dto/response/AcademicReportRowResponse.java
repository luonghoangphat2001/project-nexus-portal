package com.nexus.portal.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AcademicReportRowResponse(
        Long periodId,
        String periodName,
        Long departmentId,
        String departmentName,
        Long topicId,
        String topicTitle,
        long studentCount,
        BigDecimal averageFinalScore,
        long passCount,
        long failCount,
        Map<String, Long> scoreDistribution
) {
    public static final List<String> SCORE_BANDS = List.of(
            "0.00-4.99", "5.00-5.99", "6.00-6.99", "7.00-7.99", "8.00-8.99", "9.00-10.00");
}
