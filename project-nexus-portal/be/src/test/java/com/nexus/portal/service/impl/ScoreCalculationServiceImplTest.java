package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.ResultResponse;
import com.nexus.portal.enums.AssessmentStatus;
import com.nexus.portal.enums.AssessmentType;
import com.nexus.portal.enums.CouncilStatus;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.AssessmentRepository;
import com.nexus.portal.repository.DefenseAssignmentRepository;
import com.nexus.portal.repository.PublishedResultRepository;
import com.nexus.portal.repository.TeamMemberRepository;
import com.nexus.portal.service.CalculatedScore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScoreCalculationServiceImplTest {
    @Mock private AssessmentRepository assessments;
    @Mock private DefenseAssignmentRepository assignments;
    @Mock private TeamMemberRepository members;
    @Mock private PublishedResultRepository publishedResultsReader;
    @Mock private DefenseAccessPolicy access;

    private ScoreCalculationServiceImpl service;
    private User manager;
    private User student;
    private Department department;
    private DefenseCouncil council;
    private DefenseAssignment assignment;
    private List<Assessment> submitted;

    @BeforeEach
    void setUp() {
        service = new ScoreCalculationServiceImpl(assessments, assignments, members, publishedResultsReader, access);

        manager = new User();
        manager.setId(1L);
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

        submitted = List.of(
                assessment(AssessmentType.REVIEW, "8.00", "8.00", "8.00"),
                assessment(AssessmentType.DEFENSE, "7.00", "7.50", "8.00"));
    }

    @Test
    void calculatesPreviewForCompletedAssignment() {
        givenManagerAccess();
        when(publishedResultsReader.findByAssignmentIdOrderByStudentIdAsc(9L)).thenReturn(List.of());
        givenCalculationDependencies(submitted);

        List<ResultResponse.Defense> result = service.getAssignmentScores(9L, "admin");

        assertEquals(1, result.size());
        assertEquals(new BigDecimal("8.00"), result.get(0).reviewScore());
        assertEquals(new BigDecimal("7.50"), result.get(0).defenseScore());
        assertEquals(new BigDecimal("7.65"), result.get(0).finalScore());
        assertTrue(result.get(0).passed());
        assertFalse(result.get(0).published());
    }

    @Test
    void returnsPublishedGradesWithoutRecalculating() {
        givenManagerAccess();
        PublishedResult saved = new PublishedResult();
        saved.setAssignment(assignment);
        saved.setStudent(student);
        saved.setReviewScore(new BigDecimal("8.00"));
        saved.setDefenseScore(new BigDecimal("7.50"));
        saved.setFinalScore(new BigDecimal("7.65"));
        saved.setPassed(true);
        when(publishedResultsReader.findByAssignmentIdOrderByStudentIdAsc(9L)).thenReturn(List.of(saved));

        List<ResultResponse.Defense> result = service.getAssignmentScores(9L, "admin");

        assertTrue(result.get(0).published());
        assertEquals(new BigDecimal("7.65"), result.get(0).finalScore());
        verify(assessments, never()).findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(any());
    }

    @Test
    void rejectsIncompleteAssessments() {
        givenCalculationDependencies(List.of(submitted.get(0)));

        assertThrows(BadRequestException.class, () -> service.calculateScores(assignment));
    }

    @Test
    void refusesToCalculateBeforeCouncilCompletion() {
        council.setStatus(CouncilStatus.SCHEDULED);

        assertThrows(BadRequestException.class, () -> service.calculateScores(assignment));
        verify(assessments, never()).findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(any());
    }

    @Test
    void refusesManagerAccessOutsideDepartmentScope() {
        when(access.getUser("admin")).thenReturn(manager);
        when(assignments.findById(9L)).thenReturn(Optional.of(assignment));
        when(access.canManage(manager, department)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> service.getAssignmentScores(9L, "admin"));
        verify(publishedResultsReader, never()).findByAssignmentIdOrderByStudentIdAsc(any());
    }

    private Assessment assessment(AssessmentType type, String content, String implementation, String presentation) {
        Assessment assessment = new Assessment();
        assessment.setType(type);
        assessment.setStatus(AssessmentStatus.SUBMITTED);
        assessment.setStudent(student);
        assessment.setContentScore(new BigDecimal(content));
        assessment.setImplementationScore(new BigDecimal(implementation));
        assessment.setPresentationScore(new BigDecimal(presentation));
        return assessment;
    }

    private void givenCalculationDependencies(List<Assessment> assessmentsForAssignment) {
        when(assessments.findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(9L))
                .thenReturn(assessmentsForAssignment);
        when(members.findByTeamId(5L)).thenReturn(List.of(TeamMember.builder().user(student).build()));
    }

    private void givenManagerAccess() {
        when(access.getUser("admin")).thenReturn(manager);
        when(access.canManage(manager, department)).thenReturn(true);
        when(assignments.findById(9L)).thenReturn(Optional.of(assignment));
    }
}
