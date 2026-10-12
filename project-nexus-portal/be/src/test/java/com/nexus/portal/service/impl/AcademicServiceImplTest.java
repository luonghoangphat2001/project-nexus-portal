package com.nexus.portal.service.impl;
import com.nexus.portal.dto.request.*;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.model.Faculty;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.AuditLogService;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AcademicServiceImplTest {
    private final FacultyRepository faculties = mock(FacultyRepository.class);
    private final CohortRepository cohorts = mock(CohortRepository.class);
    private final AcademicServiceImpl service = new AcademicServiceImpl(faculties, mock(DepartmentRepository.class),
            mock(MajorRepository.class), cohorts, mock(AuditLogService.class));
    @Test void rejectsDuplicateFacultyCode() {
        Faculty existing = new Faculty(); existing.setId(1L);
        when(faculties.findByCode("FIT")).thenReturn(Optional.of(existing));
        assertThrows(BadRequestException.class, () -> service.createFaculty(new FacultyRequest(" FIT ", "Information Technology"), "admin"));
        verify(faculties, never()).save(any());
    }
    @Test void rejectsGraduationBeforeAdmission() {
        assertThrows(BadRequestException.class, () -> service.createCohort(new CohortRequest("K26", "Cohort 2026", 2026, 2025), "admin"));
        verify(cohorts, never()).save(any());
    }
}
