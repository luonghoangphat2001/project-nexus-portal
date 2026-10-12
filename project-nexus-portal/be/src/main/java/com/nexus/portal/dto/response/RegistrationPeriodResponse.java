package com.nexus.portal.dto.response;

import com.nexus.portal.enums.PeriodStatus;
import java.time.LocalDateTime;
import java.util.Set;

public record RegistrationPeriodResponse(Long id, String name, String academicYear, Integer semester,
        LocalDateTime startDate, LocalDateTime endDate, LocalDateTime submissionDeadline,
        PeriodStatus status, Set<Long> facultyIds, Set<Long> cohortIds) {
}
