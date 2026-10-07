package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.FinalGradeResponse;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.AuditLogService;
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
class FinalResultServiceImplTest {
    @Mock private AssessmentRepository assessments;
    @Mock private DefenseAssignmentRepository assignments;
    @Mock private DefenseCouncilRepository councils;
    @Mock private TeamMemberRepository members;
    @Mock private FinalResultRepository results;
    @Mock private DepartmentRepository departments;
    @Mock private RegistrationPeriodRepository periods;
    @Mock private TopicRepository topics;
    @Mock private DefenseAccessPolicy access;
    @Mock private AuditLogService audit;

    private final Clock clock = Clock.fixed(Instant.parse("2026-10-07T00:00:00Z"), ZoneOffset.UTC);
    private FinalResultServiceImpl service;
    private User manager;
    private User student;
    private Department department;
    private DefenseCouncil council;
    private DefenseAssignment assignment;
    private List<Assessment> submitted;

    @BeforeEach
    void setUp() {
        service = new FinalResultServiceImpl(assessments, assignments, councils, members, results,
                departments, periods, topics, access, audit, clock);

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

        submitted = List.of(
                assessment(AssessmentType.REVIEW, "8.00", "8.00", "8.00"),
                assessment(AssessmentType.DEFENSE, "7.00", "7.50", "8.00"));
        when(access.getUser("admin")).thenReturn(manager);
        when(access.canManage(manager, department)).thenReturn(true);
        when(assignments.findById(9L)).thenReturn(Optional.of(assignment));
    }

    @Test
    void publishesWeightedSnapshotOnlyAfterCompletedCouncil() {
        givenPublishDependencies(submitted);
        when(results.existsByAssignmentId(9L)).thenReturn(false);
        when(results.saveAllAndFlush(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<FinalGradeResponse> published = service.publishAssignmentGrades(9L, "admin");

        assertEquals(1, published.size());
        assertEquals(new BigDecimal("8.00"), published.get(0).reviewScore());
        assertEquals(new BigDecimal("7.50"), published.get(0).defenseScore());
        assertEquals(new BigDecimal("7.65"), published.get(0).finalScore());
        assertTrue(published.get(0).passed());
        assertTrue(published.get(0).published());
        assertEquals(Instant.parse("2026-10-07T00:00:00Z"), published.get(0).publishedAt().toInstant(ZoneOffset.UTC));
        verify(audit).log(1L, "admin", "PUBLISH_FINAL_RESULTS", "results/assignments/9",
                "Đã công bố 1 kết quả cho đăng ký 6", null, null, "SUCCESS");
    }

    @Test
    void rejectsIncompleteAssessmentSetInsteadOfPublishingPartialGrades() {
        givenPublishDependencies(List.of(submitted.get(0)));
        when(results.existsByAssignmentId(9L)).thenReturn(false);

        assertThrows(BadRequestException.class, () -> service.publishAssignmentGrades(9L, "admin"));
        verify(results, never()).saveAllAndFlush(anyList());
        verify(audit, never()).log(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void refusesToCalculateBeforeCouncilCompletion() {
        council.setStatus(CouncilStatus.SCHEDULED);

        assertThrows(BadRequestException.class, () -> service.getAssignmentGrades(9L, "admin"));
        verify(assessments, never()).findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(any());
    }

    @Test
    void refusesManagerAccessOutsideDepartmentScope() {
        when(access.canManage(manager, department)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> service.getAssignmentGrades(9L, "admin"));
        verify(assessments, never()).findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(any());
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

    private void givenPublishDependencies(List<Assessment> assessmentsForAssignment) {
        when(assignments.findCouncilIdById(9L)).thenReturn(Optional.of(8L));
        when(councils.findLockedById(8L)).thenReturn(Optional.of(council));
        when(assessments.findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(9L))
                .thenReturn(assessmentsForAssignment);
        when(members.findByTeamId(5L)).thenReturn(List.of(TeamMember.builder().user(student).build()));
    }
}
