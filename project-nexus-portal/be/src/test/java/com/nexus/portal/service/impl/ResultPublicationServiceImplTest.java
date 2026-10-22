package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.ResultResponse;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.DefenseAssignmentRepository;
import com.nexus.portal.repository.DefenseCouncilRepository;
import com.nexus.portal.repository.DepartmentRepository;
import com.nexus.portal.repository.PublishedResultDetailsRepository;
import com.nexus.portal.repository.ResultRepository;
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
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResultPublicationServiceImplTest {
    @Mock private DefenseAssignmentRepository assignments;
    @Mock private DefenseCouncilRepository councils;
    @Mock private ResultRepository results;
    @Mock private PublishedResultDetailsRepository resultDetails;
    @Mock private ScoreCalculationService scoreCalculation;
    @Mock private DefenseAccessPolicy access;
    @Mock private AuditLogService audit;
    @Mock private DepartmentRepository departments;
    @Mock private RegistrationPeriodRepository periods;
    @Mock private TopicRepository topics;

    private final Clock clock = Clock.fixed(Instant.parse("2026-10-07T00:00:00Z"), ZoneOffset.UTC);
    private ResultServiceImpl service;
    private User manager;
    private User student;
    private Department department;
    private DefenseCouncil council;
    private DefenseAssignment assignment;

    @BeforeEach
    void setUp() {
        service = new ResultServiceImpl(assignments, councils, results, resultDetails, scoreCalculation,
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
        lenient().when(access.canManage(manager, department)).thenReturn(true);
        lenient().when(assignments.findById(9L)).thenReturn(Optional.of(assignment));
    }

    @Test
    void publishesWeightedSnapshotOnlyAfterCompletedCouncil() {
        givenPublishDependencies();
        when(results.existsByAssignmentId(9L)).thenReturn(false);
        when(scoreCalculation.calculateScores(assignment)).thenReturn(List.of(
                new CalculatedScore(student, breakdown("8.00"), breakdown("8.50"), breakdown("9.00"),
                        new BigDecimal("8.65"), true)));
        when(results.saveAllAndFlush(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        when(resultDetails.saveAllAndFlush(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<ResultResponse.Defense> published = service.publishAssignmentResults(9L, "admin");

        assertEquals(1, published.size());
        assertEquals(new BigDecimal("8.00"), published.get(0).advisorScore());
        assertEquals(new BigDecimal("8.50"), published.get(0).reviewScore());
        assertEquals(new BigDecimal("9.00"), published.get(0).defenseScore());
        assertEquals(new BigDecimal("8.65"), published.get(0).finalScore());
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
    void rejectsRepublishingTheSameAssignment() {
        givenPublishDependencies();
        when(results.existsByAssignmentId(9L)).thenReturn(true);

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> service.publishAssignmentResults(9L, "admin"));

        assertEquals("Results have already been published for this assignment.", error.getMessage());
        verify(results, never()).saveAllAndFlush(anyList());
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

    @Test
    void publishesEveryPendingAssignmentOfThePeriod() {
        givenPublishDependencies();
        when(periods.existsById(3L)).thenReturn(true);
        when(assignments.findUnpublishedCompletedByPeriodId(3L)).thenReturn(List.of(assignment));
        when(results.existsByAssignmentId(9L)).thenReturn(false);
        when(scoreCalculation.calculateScores(assignment)).thenReturn(List.of(
                new CalculatedScore(student, breakdown("8.00"), breakdown("8.50"), breakdown("9.00"),
                        new BigDecimal("8.65"), true)));
        when(results.saveAllAndFlush(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        when(resultDetails.saveAllAndFlush(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<ResultResponse.Defense> published = service.publishPeriodResults(3L, "admin");

        assertEquals(1, published.size());
        assertEquals(new BigDecimal("8.65"), published.get(0).finalScore());
        assertTrue(published.get(0).published());
    }

    @Test
    void rejectsPeriodPublicationWhenNothingIsPending() {
        when(periods.existsById(3L)).thenReturn(true);
        when(assignments.findUnpublishedCompletedByPeriodId(3L)).thenReturn(List.of());

        assertThrows(BadRequestException.class, () -> service.publishPeriodResults(3L, "admin"));
        verify(results, never()).saveAllAndFlush(anyList());
    }

    @Test
    void republishesOldSnapshotWithFreshCalculationAndAuditReason() {
        Result oldResult = new Result();
        oldResult.setId(100L);
        givenPublishDependencies();
        when(results.findByAssignmentIdOrderByStudentIdAsc(9L)).thenReturn(List.of(oldResult));
        when(results.existsByAssignmentId(9L)).thenReturn(false);
        when(scoreCalculation.calculateScores(assignment)).thenReturn(List.of(
                new CalculatedScore(student, breakdown("9.00"), breakdown("9.00"), breakdown("9.00"),
                        new BigDecimal("9.00"), true)));
        when(results.saveAllAndFlush(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        when(resultDetails.saveAllAndFlush(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<ResultResponse.Defense> republished = service.republishAssignmentResults(9L, "Sai diem phan bien", "admin");

        assertEquals(1, republished.size());
        assertEquals(new BigDecimal("9.00"), republished.get(0).finalScore());
        verify(resultDetails).deleteAllById(List.of(100L));
        verify(results).deleteAll(List.of(oldResult));
        verify(results).flush();
        verify(audit).log(1L, "admin", "REPUBLISH_RESULTS", "results/assignments/9",
                "Re-publishing 1 published results for registration 6. Reason: Sai diem phan bien", null, null, "SUCCESS");
    }

    @Test
    void rejectsRepublishWhenAssignmentHasNoPublishedResults() {
        when(results.findByAssignmentIdOrderByStudentIdAsc(9L)).thenReturn(List.of());

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> service.republishAssignmentResults(9L, null, "admin"));

        assertEquals("No published results to adjust; use the regular publish action instead", error.getMessage());
        verify(resultDetails, never()).deleteAllById(anyList());
        verify(scoreCalculation, never()).calculateScores(any());
    }

    @Test
    void refusesRepublishOutsideDepartmentScope() {
        when(access.canManage(manager, department)).thenReturn(false);

        assertThrows(AccessDeniedException.class,
                () -> service.republishAssignmentResults(9L, null, "admin"));
        verify(results, never()).deleteAll(anyList());
    }

    @Test
    void republishPropagatesFailureWhenAssessmentsAreIncomplete() {
        Result oldResult = new Result();
        oldResult.setId(100L);
        givenPublishDependencies();
        when(results.findByAssignmentIdOrderByStudentIdAsc(9L)).thenReturn(List.of(oldResult));
        when(results.existsByAssignmentId(9L)).thenReturn(false);
        when(scoreCalculation.calculateScores(assignment))
                .thenThrow(new BadRequestException("Advisor, reviewer, or defense assessments are incomplete"));

        assertThrows(BadRequestException.class, () -> service.republishAssignmentResults(9L, null, "admin"));
    }

    @Test
    void adjustsPublishedResultWithReasonAndRecomputedFinalScore() {
        Result published = publishedResult();
        var details = PublishedResultDetails.from(published, new CalculatedScore(student,
                breakdown("8.00"), breakdown("8.50"), breakdown("9.00"), new BigDecimal("8.65"), true));
        givenPublishDependencies();
        when(results.findByAssignmentIdOrderByStudentIdAsc(9L)).thenReturn(List.of(published));
        when(resultDetails.findById(100L)).thenReturn(Optional.of(details));
        when(results.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(resultDetails.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ResultResponse.Defense adjusted = service.adjustPublishedResult(9L, 7L,
                new BigDecimal("9.00"), null, null, "GVHD cham nham", "admin");

        assertEquals(new BigDecimal("9.00"), adjusted.advisorScore());
        assertEquals(new BigDecimal("8.85"), adjusted.finalScore());
        assertTrue(adjusted.passed());
        verify(audit).log(eq(1L), eq("admin"), eq("ADJUST_RESULT"), eq("results/100"),
                argThat(message -> message.contains("GVHD cham nham") && message.contains("8.00 -> 9.00")),
                isNull(), isNull(), eq("SUCCESS"));
    }

    @Test
    void rejectsAdjustWithoutReason() {
        givenPublishDependencies();

        assertThrows(BadRequestException.class,
                () -> service.adjustPublishedResult(9L, 7L, new BigDecimal("9.00"), null, null, "  ", "admin"));
        verify(results, never()).saveAndFlush(any());
    }

    @Test
    void rejectsAdjustWithoutAnyScoreChange() {
        givenPublishDependencies();

        assertThrows(BadRequestException.class,
                () -> service.adjustPublishedResult(9L, 7L, null, null, null, "Ly do hop le", "admin"));
        verify(results, never()).saveAndFlush(any());
    }

    @Test
    void rejectsAdjustWithScoreOutsideAllowedRange() {
        givenPublishDependencies();

        assertThrows(BadRequestException.class,
                () -> service.adjustPublishedResult(9L, 7L, new BigDecimal("10.50"), null, null, "Ly do", "admin"));
        verify(results, never()).saveAndFlush(any());
    }

    @Test
    void rejectsAdjustOutsideDepartmentScope() {
        givenPublishDependencies();
        when(access.canManage(manager, department)).thenReturn(false);

        assertThrows(AccessDeniedException.class,
                () -> service.adjustPublishedResult(9L, 7L, new BigDecimal("9.00"), null, null, "Ly do", "admin"));
        verify(results, never()).saveAndFlush(any());
    }

    @Test
    void rejectsAdjustWhenStudentHasNoPublishedResult() {
        givenPublishDependencies();
        when(results.findByAssignmentIdOrderByStudentIdAsc(9L)).thenReturn(List.of());

        assertThrows(ResourceNotFoundException.class,
                () -> service.adjustPublishedResult(9L, 7L, new BigDecimal("9.00"), null, null, "Ly do", "admin"));
    }

    private Result publishedResult() {
        Result result = new Result();
        result.setId(100L);
        result.setAssignment(assignment);
        result.setStudent(student);
        result.setReviewScore(new BigDecimal("8.50"));
        result.setDefenseScore(new BigDecimal("9.00"));
        result.setFinalScore(new BigDecimal("8.65"));
        result.setPassed(true);
        result.setPublishedBy(manager);
        result.setPublishedAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC));
        return result;
    }

    private CalculatedScore.AssessmentBreakdown breakdown(String score) {
        BigDecimal value = new BigDecimal(score);
        return new CalculatedScore.AssessmentBreakdown(value, value, value, value, "Evaluator", "Comment");
    }

    private void givenPublishDependencies() {
        when(assignments.findCouncilIdById(9L)).thenReturn(Optional.of(8L));
        when(councils.findLockedById(8L)).thenReturn(Optional.of(council));
    }
}
