package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.AcademicReportRowResponse;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.AcademicReportRepository;
import com.nexus.portal.repository.DepartmentRepository;
import com.nexus.portal.repository.RegistrationPeriodRepository;
import com.nexus.portal.repository.TopicRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AcademicReportServiceImplTest {
    @Mock private AcademicReportRepository reports;
    @Mock private DepartmentRepository departments;
    @Mock private RegistrationPeriodRepository periods;
    @Mock private TopicRepository topics;
    @Mock private DefenseAccessPolicy access;

    private AcademicReportServiceImpl service;
    private User manager;
    private Department department;
    private RegistrationPeriod period;
    private Topic topic;

    @BeforeEach
    void setUp() {
        service = new AcademicReportServiceImpl(reports, departments, periods, topics, access);

        manager = new User();
        manager.setId(1L);
        manager.setUsername("admin");
        department = new Department();
        department.setId(2L);
        department.setName("Khoa Công nghệ thông tin");
        period = new RegistrationPeriod();
        period.setId(3L);
        period.setName("Học kỳ Thu 2026");
        topic = new Topic();
        topic.setId(4L);
        topic.setTitle("Cổng thông tin Nexus");
        topic.setDepartment(department);
        topic.setPeriod(period);

        when(access.getUser("admin")).thenReturn(manager);
        when(access.hasRole(manager, RoleName.ROLE_ADMIN)).thenReturn(true);
        when(access.canManage(manager, department)).thenReturn(true);
    }

    @Test
    void reportsOnlyPublishedResultsWithinAuthorizedFilters() {
        when(departments.findAll()).thenReturn(List.of(department));
        when(periods.existsById(3L)).thenReturn(true);
        when(topics.findById(4L)).thenReturn(Optional.of(topic));
        when(reports.findPublishedForReport(Set.of(2L), 3L, 2L, 4L))
                .thenReturn(List.of(publishedResult("7.65", true)));

        List<AcademicReportRowResponse> result = service.getAcademicReport(3L, 2L, 4L, "admin");

        assertEquals(1, result.size());
        assertEquals(1, result.get(0).studentCount());
        assertEquals(new BigDecimal("7.65"), result.get(0).averageFinalScore());
        assertEquals(1, result.get(0).passCount());
        assertEquals(1L, result.get(0).scoreDistribution().get("7.00-7.99"));
        verify(reports).findPublishedForReport(Set.of(2L), 3L, 2L, 4L);
    }

    @Test
    void rejectsDepartmentOutsideManagerScopeBeforeQuerying() {
        when(departments.findAll()).thenReturn(List.of(department));

        assertThrows(AccessDeniedException.class, () -> service.getAcademicReport(3L, 99L, null, "admin"));
        verify(reports, never()).findPublishedForReport(anySet(), any(), any(), any());
    }

    private FinalResult publishedResult(String score, boolean passed) {
        User student = new User();
        student.setId(7L);
        DefenseCouncil council = new DefenseCouncil();
        DefenseAssignment assignment = new DefenseAssignment();
        assignment.setRegistration(registration(topic));
        assignment.setCouncil(council);

        FinalResult result = new FinalResult();
        result.setAssignment(assignment);
        result.setStudent(student);
        result.setReviewScore(new BigDecimal("8.00"));
        result.setDefenseScore(new BigDecimal("7.50"));
        result.setFinalScore(new BigDecimal(score));
        result.setPassed(passed);
        result.setPublishedAt(LocalDateTime.parse("2026-10-07T00:00:00"));
        return result;
    }

    private TopicRegistration registration(Topic targetTopic) {
        Team team = new Team();
        team.setName("Nhóm 1");
        TopicRegistration registration = new TopicRegistration();
        registration.setTopic(targetTopic);
        registration.setTeam(team);
        return registration;
    }
}
