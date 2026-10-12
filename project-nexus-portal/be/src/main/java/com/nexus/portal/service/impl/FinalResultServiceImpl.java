package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.FinalGradeResponse;
import com.nexus.portal.enums.AssessmentStatus;
import com.nexus.portal.enums.AssessmentType;
import com.nexus.portal.enums.CouncilStatus;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.AuditLogService;
import com.nexus.portal.service.FinalResultService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class FinalResultServiceImpl implements FinalResultService {
    private final AssessmentRepository assessments;
    private final DefenseAssignmentRepository assignments;
    private final DefenseCouncilRepository councils;
    private final TeamMemberRepository members;
    private final FinalResultRepository results;
    private final DefenseAccessPolicy access;
    private final AuditLogService audit;
    private final Clock clock;

    public FinalResultServiceImpl(AssessmentRepository assessments, DefenseAssignmentRepository assignments,
                                  DefenseCouncilRepository councils, TeamMemberRepository members,
                                  FinalResultRepository results, DefenseAccessPolicy access,
                                  AuditLogService audit, Clock clock) {
        this.assessments = assessments;
        this.assignments = assignments;
        this.councils = councils;
        this.members = members;
        this.results = results;
        this.access = access;
        this.audit = audit;
        this.clock = clock;
    }

    @Override
    public List<FinalGradeResponse> getAssignmentGrades(Long assignmentId, String identifier) {
        User manager = access.getUser(identifier);
        DefenseAssignment assignment = getAssignment(assignmentId);
        requireManager(manager, assignment.getRegistration().getTopic().getDepartment());
        List<FinalResult> published = results.findByAssignmentIdOrderByStudentIdAsc(assignmentId);
        if (!published.isEmpty()) return published.stream().map(this::toResponse).toList();
        return calculate(assignment).stream().map(grade -> toResponse(assignment, grade, false, null)).toList();
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<FinalGradeResponse> publishAssignmentGrades(Long assignmentId, String identifier) {
        User manager = access.getUser(identifier);
        Long councilId = assignments.findCouncilIdById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Defense assignment not found"));
        DefenseCouncil council = councils.findLockedById(councilId)
                .orElseThrow(() -> new ResourceNotFoundException("Defense council not found"));
        DefenseAssignment assignment = getAssignment(assignmentId);
        Department department = assignment.getRegistration().getTopic().getDepartment();
        requireManager(manager, department);
        if (council.getStatus() != CouncilStatus.COMPLETED) {
            throw new BadRequestException("Results can only be published after the council is completed");
        }
        if (results.existsByAssignmentId(assignmentId)) {
            throw new BadRequestException("Results for this assignment have already been published");
        }

        LocalDateTime publishedAt = LocalDateTime.now(clock);
        List<CalculatedGrade> grades = calculate(assignment);
        List<FinalResult> published = grades.stream().map(grade -> {
            FinalResult result = new FinalResult();
            result.setAssignment(assignment);
            result.setStudent(grade.student());
            result.setReviewScore(grade.reviewScore());
            result.setDefenseScore(grade.defenseScore());
            result.setFinalScore(grade.finalScore());
            result.setPassed(grade.passed());
            result.setPublishedBy(manager);
            result.setPublishedAt(publishedAt);
            return result;
        }).toList();
        List<FinalResult> saved = results.saveAllAndFlush(published);
        audit.log(manager.getId(), manager.getUsername(), "PUBLISH_FINAL_RESULTS",
                "results/assignments/" + assignmentId,
                "Published " + saved.size() + " final grades for registration "
                        + assignment.getRegistration().getId(), null, null, "SUCCESS");
        return saved.stream().map(this::toResponse).toList();
    }

    @Override
    public List<FinalGradeResponse> getMyPublishedGrades(String identifier) {
        User student = access.getUser(identifier);
        if (!access.hasRole(student, RoleName.ROLE_USER)) {
            throw new AccessDeniedException("Only students can view their own results");
        }
        return results.findByStudentIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(student.getId())
                .stream().map(this::toResponse).toList();
    }

    private List<CalculatedGrade> calculate(DefenseAssignment assignment) {
        if (assignment.getCouncil().getStatus() != CouncilStatus.COMPLETED) {
            throw new BadRequestException("Results are only available after the council is completed");
        }
        List<Assessment> submitted = assessments.findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(assignment.getId())
                .stream().filter(a -> a.getStatus() == AssessmentStatus.SUBMITTED).toList();
        int expectedDefenseAssessments = assignment.getCouncil().getMembers().size();
        if (expectedDefenseAssessments == 0) {
            throw new BadRequestException("No members have been assigned to this council");
        }

        List<TeamMember> students = members.findByTeamId(assignment.getRegistration().getTeam().getId());
        if (students.isEmpty()) throw new BadRequestException("The assigned team has no students");
        List<CalculatedGrade> grades = new ArrayList<>(students.size());
        for (TeamMember member : students) {
            User student = member.getUser();
            List<Assessment> studentAssessments = submitted.stream()
                    .filter(a -> a.getStudent().getId().equals(student.getId())).toList();
            List<Assessment> reviews = studentAssessments.stream()
                    .filter(a -> a.getType() == AssessmentType.REVIEW).toList();
            List<Assessment> defenses = studentAssessments.stream()
                    .filter(a -> a.getType() == AssessmentType.DEFENSE).toList();
            if (reviews.size() != 1 || defenses.size() != expectedDefenseAssessments) {
                throw new BadRequestException("Submitted assessments are incomplete for student " + student.getId());
            }
            BigDecimal reviewScore = FinalGradeCalculator.average(reviews);
            BigDecimal defenseScore = FinalGradeCalculator.average(defenses);
            BigDecimal finalScore = FinalGradeCalculator.finalScore(reviewScore, defenseScore);
            grades.add(new CalculatedGrade(student, reviewScore, defenseScore,
                    finalScore, FinalGradeCalculator.passed(finalScore)));
        }
        return grades;
    }

    private void requireManager(User user, Department department) {
        if (!access.canManage(user, department)) {
            throw new AccessDeniedException("You are not authorized to manage results for this department");
        }
    }

    private DefenseAssignment getAssignment(Long assignmentId) {
        return assignments.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Defense assignment not found"));
    }

    private FinalGradeResponse toResponse(DefenseAssignment assignment, CalculatedGrade grade,
                                          boolean published, LocalDateTime publishedAt) {
        Topic topic = assignment.getRegistration().getTopic();
        return new FinalGradeResponse(assignment.getId(), assignment.getRegistration().getId(),
                topic.getPeriod().getId(), topic.getPeriod().getName(), topic.getDepartment().getId(),
                topic.getDepartment().getName(), topic.getId(), topic.getTitle(),
                assignment.getRegistration().getTeam().getName(), grade.student().getId(),
                grade.student().getFullName(), grade.student().getStudentCode(), grade.reviewScore(),
                grade.defenseScore(), grade.finalScore(), grade.passed(), published, publishedAt);
    }

    private FinalGradeResponse toResponse(FinalResult result) {
        DefenseAssignment assignment = result.getAssignment();
        Topic topic = assignment.getRegistration().getTopic();
        User student = result.getStudent();
        return new FinalGradeResponse(assignment.getId(), assignment.getRegistration().getId(),
                topic.getPeriod().getId(), topic.getPeriod().getName(), topic.getDepartment().getId(),
                topic.getDepartment().getName(), topic.getId(), topic.getTitle(),
                assignment.getRegistration().getTeam().getName(), student.getId(), student.getFullName(),
                student.getStudentCode(), result.getReviewScore(), result.getDefenseScore(),
                result.getFinalScore(), result.isPassed(), true, result.getPublishedAt());
    }

    private record CalculatedGrade(User student, BigDecimal reviewScore, BigDecimal defenseScore,
                                   BigDecimal finalScore, boolean passed) {}

}
