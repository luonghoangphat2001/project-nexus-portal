package com.nexus.portal.dto.response;

import com.nexus.portal.enums.AppealStatus;
import java.time.LocalDateTime;

public record GradeAppealResponse(
        Long id,
        Long assignmentId,
        Long registrationId,
        Long topicId,
        String topicTitle,
        String teamName,
        Long studentId,
        String studentName,
        String studentCode,
        String reason,
        AppealStatus status,
        String responseNote,
        Long reviewedById,
        String reviewedByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

