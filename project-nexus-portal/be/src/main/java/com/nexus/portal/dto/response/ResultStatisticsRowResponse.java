package com.nexus.portal.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public record ResultStatisticsRowResponse(
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
) {}
