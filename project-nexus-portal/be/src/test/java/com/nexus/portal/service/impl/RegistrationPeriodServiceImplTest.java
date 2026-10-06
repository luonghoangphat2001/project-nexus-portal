package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.RegistrationPeriodRequest;
import com.nexus.portal.enums.PeriodStatus;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RegistrationPeriodServiceImplTest {
    private final RegistrationPeriodRepository periods = mock(RegistrationPeriodRepository.class);
    private final FacultyRepository faculties = mock(FacultyRepository.class);
    private final CohortRepository cohorts = mock(CohortRepository.class);
    private final TeamRepository teams = mock(TeamRepository.class);
    private final TopicRepository topics = mock(TopicRepository.class);
    private final RegistrationPeriodServiceImpl service = new RegistrationPeriodServiceImpl(periods, faculties, cohorts, teams, topics);
    private final LocalDateTime start = LocalDateTime.of(2026, 10, 1, 8, 0);

    private RegistrationPeriodRequest request(String year, LocalDateTime end, LocalDateTime deadline) {
        return new RegistrationPeriodRequest("Capstone", year, 1, start, end, deadline, PeriodStatus.DRAFT, Set.of(1L), Set.of(1L));
    }
    @Test void rejectsReversedDates() {
        assertThrows(BadRequestException.class, () -> service.save(null, request("2026-2027", start.minusDays(1), start.plusDays(10))));
        verifyNoInteractions(periods);
    }
    @Test void rejectsDeadlineBeforeRegistrationEnds() {
        assertThrows(BadRequestException.class, () -> service.save(null, request("2026-2027", start.plusDays(5), start.plusDays(4))));
    }
    @Test void rejectsNonconsecutiveAcademicYears() {
        assertThrows(BadRequestException.class, () -> service.save(null, request("2026-2028", start.plusDays(5), start.plusDays(10))));
    }
    @Test void rejectsUnknownTargets() {
        assertThrows(BadRequestException.class, () -> service.save(null, request("2026-2027", start.plusDays(5), start.plusDays(10))));
    }
    @Test void createsPeriodWithSelectedTargets() {
        Faculty faculty = new Faculty(); faculty.setId(1L);
        Cohort cohort = new Cohort(); cohort.setId(1L);
        when(faculties.findAllById(Set.of(1L))).thenReturn(List.of(faculty));
        when(cohorts.findAllById(Set.of(1L))).thenReturn(List.of(cohort));
        when(periods.save(any())).thenAnswer(call -> { RegistrationPeriod period = call.getArgument(0); period.setId(9L); return period; });
        var result = service.save(null, request("2026-2027", start.plusDays(5), start.plusDays(10)));
        assertEquals(9L, result.id()); assertEquals(Set.of(1L), result.facultyIds());
    }
    @Test void preventsDeletingPeriodWithTopics() {
        when(periods.findById(1L)).thenReturn(Optional.of(new RegistrationPeriod()));
        when(topics.existsByPeriodId(1L)).thenReturn(true);
        assertThrows(BadRequestException.class, () -> service.delete(1L));
        verify(periods, never()).delete(any());
    }
}
