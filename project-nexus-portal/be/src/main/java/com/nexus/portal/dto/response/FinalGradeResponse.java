package com.nexus.portal.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FinalGradeResponse(
        Long assignmentId,
        Long registrationId,
        Long periodId,
        String periodName,
        Long departmentId,
        String departmentName,
        Long topicId,
        String topicTitle,
        String teamName,
        Long studentId,
        String studentName,
        String studentCode,
        BigDecimal reviewScore,
        BigDecimal defenseScore,
        BigDecimal finalScore,
        boolean passed,
        boolean published,
        LocalDateTime publishedAt
) {}
