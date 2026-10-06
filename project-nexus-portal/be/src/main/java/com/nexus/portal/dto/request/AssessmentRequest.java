package com.nexus.portal.dto.request;

import com.nexus.portal.enums.AssessmentType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record AssessmentRequest(
        @NotNull @Positive Long assignmentId,
        @NotNull @Positive Long studentId,
        @NotNull AssessmentType type,
        @NotNull @DecimalMin("0.00") @DecimalMax("10.00") @Digits(integer = 2, fraction = 2) BigDecimal contentScore,
        @NotNull @DecimalMin("0.00") @DecimalMax("10.00") @Digits(integer = 2, fraction = 2) BigDecimal implementationScore,
        @NotNull @DecimalMin("0.00") @DecimalMax("10.00") @Digits(integer = 2, fraction = 2) BigDecimal presentationScore,
        @Size(max = 4000) String strengths,
        @Size(max = 4000) String weaknesses,
        @Size(max = 4000) String questions,
        @Size(max = 4000) String comment) {}
