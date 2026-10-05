package com.nexus.portal.dto.response;
import com.nexus.portal.enums.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public record AssessmentResponse(Long id, Long assignmentId, Long evaluatorId, String evaluatorName,
        Long studentId, String studentName, AssessmentType type, AssessmentStatus status,
        BigDecimal contentScore, BigDecimal implementationScore, BigDecimal presentationScore,
        String strengths, String weaknesses, String questions, String comment,
        LocalDateTime submittedAt, LocalDateTime updatedAt, boolean canEdit) {}
