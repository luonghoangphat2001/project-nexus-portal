package com.nexus.portal.dto.request;

import com.nexus.portal.enums.PeriodStatus;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.Set;

public record RegistrationPeriodRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Pattern(regexp = "\\d{4}-\\d{4}") String academicYear,
        @NotNull @Min(1) @Max(3) Integer semester,
        @NotNull LocalDateTime startDate,
        @NotNull LocalDateTime endDate,
        @NotNull LocalDateTime submissionDeadline,
        @NotNull PeriodStatus status,
        @NotEmpty Set<@NotNull @Positive Long> facultyIds,
        @NotEmpty Set<@NotNull @Positive Long> cohortIds) {
}
