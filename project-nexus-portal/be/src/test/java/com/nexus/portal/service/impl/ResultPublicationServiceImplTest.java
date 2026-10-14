package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.ResultResponse;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.DefenseAssignmentRepository;
import com.nexus.portal.repository.DefenseCouncilRepository;
import com.nexus.portal.repository.DepartmentRepository;
import com.nexus.portal.repository.PublishedResultRepository;
import com.nexus.portal.repository.RegistrationPeriodRepository;
import com.nexus.portal.repository.TopicRepository;
import com.nexus.portal.service.AuditLogService;
import com.nexus.portal.service.CalculatedScore;
import com.nexus.portal.service.ScoreCalculationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResultPublicationServiceImplTest {
    @Mock private DefenseAssignmentRepository assignments;
    @Mock private DefenseCouncilRepository councils;
    @Mock private PublishedResultRepository results;
    @Mock private ScoreCalculationService scoreCalculation;
    @Mock private DefenseAccessPolicy access;
    @Mock private AuditLogService audit;
    @Mock private DepartmentRepository departments;
    @Mock private RegistrationPeriodRepository periods;
    @Mock private TopicRepository topics;

    private final Clock clock = Clock.fixed(Instant.parse("2026-10-07T00:00:00Z"), ZoneOffset.UTC);
    private ResultsServiceImpl service;
    private User manager;
    private User student;
    private Department department;
    private DefenseCouncil council;
    private DefenseAssignment assignment;

    @BeforeEach
    void setUp() {
        service = new ResultsServiceImpl(assignments, councils, results, scoreCalculation,
            access, audit, clock, departments, periods, topics);

        manager = new User();
        manager.setId(1L);
        manager.setUsername("admin");
        student = new User();
        student.setId(7L);
        student.setFullName("Student Seven");
        student.setStudentCode("S007");

        department = new Department();
        department.setId(2L);
        department.setName("Computer Science");
        RegistrationPeriod period = new RegistrationPeriod();
        period.setId(3L);
        period.setName("Fall 2026");
        Topic topic = new Topic();
        topic.setId(4L);
        topic.setTitle("Nexus Project");
        topic.setDepartment(department);
        topic.setPeriod(period);
        Team team = new Team();
        team.setId(5L);
        team.setName("Team Five");
        TopicRegistration registration = new TopicRegistration();
        registration.setId(6L);
        registration.setTopic(topic);
        registration.setTeam(team);
        council = new DefenseCouncil();
        council.setId(8L);
        council.setStatus(CouncilStatus.COMPLETED);
        council.setMembers(List.of(new DefenseCouncilMember()));
        assignment = new DefenseAssignment();
        assignment.setId(9L);
        assignment.setCouncil(council);
        assignment.setRegistration(registration);

        when(access.getUser("admin")).thenReturn(manager);
        when(access.canManage(manager, department)).thenReturn(true);
        lenient().when(assignments.findById(9L)).thenReturn(Optional.of(assignment));
    }

    @Test
    void publishesWeightedSnapshotOnlyAfterCompletedCouncil() {
        givenPublishDependencies();
        when(results.existsByAssignmentId(9L)).thenReturn(false);
        when(scoreCalculation.calculateScores(assignment)).thenReturn(List.of(
                new CalculatedScore(student, new BigDecimal("8.00"), new BigDecimal("7.50"),
                        new BigDecimal("7.65"), true)));
        when(results.saveAllAndFlush(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<ResultResponse.Defense> published = service.publishAssignmentResults(9L, "admin");

        assertEquals(1, published.size());
        assertEquals(new BigDecimal("8.00"), published.get(0).reviewScore());
        assertEquals(new BigDecimal("7.50"), published.get(0).defenseScore());
        assertEquals(new BigDecimal("7.65"), published.get(0).finalScore());
        assertTrue(published.get(0).passed());
        assertTrue(published.get(0).published());
        assertEquals(Instant.parse("2026-10-07T00:00:00Z"), published.get(0).publishedAt().toInstant(ZoneOffset.UTC));
        verify(audit).log(1L, "admin", "PUBLISH_RESULTS", "results/assignments/9",
                "Published 1 results for registration 6", null, null, "SUCCESS");
    }

    @Test
    void rejectsIncompleteAssessmentSetInsteadOfPublishingPartialGrades() {
        givenPublishDependencies();
        when(results.existsByAssignmentId(9L)).thenReturn(false);
        when(scoreCalculation.calculateScores(assignment))
                .thenThrow(new BadRequestException("Submitted assessments are incomplete"));

        assertThrows(BadRequestException.class, () -> service.publishAssignmentResults(9L, "admin"));
        verify(results, never()).saveAllAndFlush(anyList());
        verify(audit, never()).log(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void refusesToPublishBeforeCouncilCompletion() {
        givenPublishDependencies();
        council.setStatus(CouncilStatus.SCHEDULED);

        assertThrows(BadRequestException.class, () -> service.publishAssignmentResults(9L, "admin"));
        verify(scoreCalculation, never()).calculateScores(any());
    }

    @Test
    void refusesManagerAccessOutsideDepartmentScope() {
        givenPublishDependencies();
        when(access.canManage(manager, department)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> service.publishAssignmentResults(9L, "admin"));
        verify(scoreCalculation, never()).calculateScores(any());
    }

    private void givenPublishDependencies() {
        when(assignments.findCouncilIdById(9L)).thenReturn(Optional.of(8L));
        when(councils.findLockedById(8L)).thenReturn(Optional.of(council));
    }
}
