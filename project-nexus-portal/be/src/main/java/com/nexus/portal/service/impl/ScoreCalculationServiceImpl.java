package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.ResultResponse;
import com.nexus.portal.enums.AssessmentStatus;
import com.nexus.portal.enums.AssessmentType;
import com.nexus.portal.enums.CouncilStatus;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.AssessmentRepository;
import com.nexus.portal.repository.DefenseAssignmentRepository;
import com.nexus.portal.repository.PublishedResultRepository;
import com.nexus.portal.repository.TeamMemberRepository;
import com.nexus.portal.service.CalculatedScore;
import com.nexus.portal.service.ScoreCalculationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ScoreCalculationServiceImpl implements ScoreCalculationService {
    private static final BigDecimal REVIEW_WEIGHT = new BigDecimal("0.30");
    private static final BigDecimal DEFENSE_WEIGHT = new BigDecimal("0.70");
    private static final BigDecimal PASSING_SCORE = new BigDecimal("5.00");

    private final AssessmentRepository assessments;
    private final DefenseAssignmentRepository assignments;
    private final TeamMemberRepository members;
    private final PublishedResultRepository publishedResults;
    private final DefenseAccessPolicy access;

    public ScoreCalculationServiceImpl(AssessmentRepository assessments, DefenseAssignmentRepository assignments,
                                 TeamMemberRepository members, PublishedResultRepository publishedResults,
                                 DefenseAccessPolicy access) {
        this.assessments = assessments;
        this.assignments = assignments;
        this.members = members;
        this.publishedResults = publishedResults;
        this.access = access;
    }

    @Override
    public List<ResultResponse.Defense> getAssignmentScores(Long assignmentId, String identifier) {
        User manager = access.getUser(identifier);
        DefenseAssignment assignment = assignments.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Defense assignment not found"));
        requireManager(manager, assignment.getRegistration().getTopic().getDepartment());
        List<PublishedResult> published = publishedResults.findByAssignmentIdOrderByStudentIdAsc(assignmentId);
        if (!published.isEmpty()) {
            return published.stream().map(this::toResponse).toList();
        }
        return calculateScores(assignment).stream()
                .map(score -> toResponse(assignment, score, false, null))
                .toList();
    }

    @Override
    public List<CalculatedScore> calculateScores(DefenseAssignment assignment) {
        if (assignment.getCouncil().getStatus() != CouncilStatus.COMPLETED) {
            throw new BadRequestException("Scores can only be calculated after the council is completed");
        }
        List<Assessment> submitted = assessments
                .findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(assignment.getId()).stream()
                .filter(assessment -> assessment.getStatus() == AssessmentStatus.SUBMITTED)
                .toList();
        int expectedDefenseAssessments = assignment.getCouncil().getMembers().size();
        if (expectedDefenseAssessments == 0) {
            throw new BadRequestException("The council has no members");
        }

        List<TeamMember> students = members.findByTeamId(assignment.getRegistration().getTeam().getId());
        if (students.isEmpty()) {
            throw new BadRequestException("The assigned team has no students");
        }
        List<CalculatedScore> calculatedScores = new ArrayList<>(students.size());
        for (TeamMember member : students) {
            User student = member.getUser();
            List<Assessment> studentAssessments = submitted.stream()
                    .filter(assessment -> assessment.getStudent().getId().equals(student.getId()))
                    .toList();
            List<Assessment> reviews = studentAssessments.stream()
                    .filter(assessment -> assessment.getType() == AssessmentType.REVIEW)
                    .toList();
            List<Assessment> defenses = studentAssessments.stream()
                    .filter(assessment -> assessment.getType() == AssessmentType.DEFENSE)
                    .toList();
            if (reviews.size() != 1 || defenses.size() != expectedDefenseAssessments) {
                throw new BadRequestException(
                        "Assessments for student " + student.getId() + " are incomplete");
            }
            BigDecimal reviewScore = averageAssessments(reviews);
            BigDecimal defenseScore = averageAssessments(defenses);
            BigDecimal finalScore = calculateFinalScore(reviewScore, defenseScore);
            calculatedScores.add(new CalculatedScore(student, reviewScore, defenseScore,
                    finalScore, isPassingScore(finalScore)));
        }
        return calculatedScores;
    }

    private void requireManager(User user, Department department) {
        if (!access.canManage(user, department)) {
            throw new AccessDeniedException("You do not have permission to manage results for this department");
        }
    }

    static BigDecimal averageAssessments(List<Assessment> assessments) {
        BigDecimal sum = assessments.stream()
                .map(assessment -> assessment.getContentScore()
                        .add(assessment.getImplementationScore())
                        .add(assessment.getPresentationScore())
                        .divide(BigDecimal.valueOf(3), 8, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(assessments.size()), 2, RoundingMode.HALF_UP);
    }

    static BigDecimal calculateFinalScore(BigDecimal reviewScore, BigDecimal defenseScore) {
        return reviewScore.multiply(REVIEW_WEIGHT)
                .add(defenseScore.multiply(DEFENSE_WEIGHT))
                .setScale(2, RoundingMode.HALF_UP);
    }

    static boolean isPassingScore(BigDecimal finalScore) {
        return finalScore.compareTo(PASSING_SCORE) >= 0;
    }

    private ResultResponse.Defense toResponse(DefenseAssignment assignment, CalculatedScore score,
                                          boolean published, LocalDateTime publishedAt) {
        Topic topic = assignment.getRegistration().getTopic();
        return new ResultResponse.Defense(assignment.getId(), assignment.getRegistration().getId(),
                topic.getPeriod().getId(), topic.getPeriod().getName(), topic.getDepartment().getId(),
                topic.getDepartment().getName(), topic.getId(), topic.getTitle(),
                assignment.getRegistration().getTeam().getName(), score.student().getId(),
                score.student().getFullName(), score.student().getStudentCode(), score.reviewScore(),
                score.defenseScore(), score.finalScore(), score.passed(), published, publishedAt);
    }

    private ResultResponse.Defense toResponse(PublishedResult result) {
        DefenseAssignment assignment = result.getAssignment();
        Topic topic = assignment.getRegistration().getTopic();
        User student = result.getStudent();
        return new ResultResponse.Defense(assignment.getId(), assignment.getRegistration().getId(),
                topic.getPeriod().getId(), topic.getPeriod().getName(), topic.getDepartment().getId(),
                topic.getDepartment().getName(), topic.getId(), topic.getTitle(),
                assignment.getRegistration().getTeam().getName(), student.getId(), student.getFullName(),
                student.getStudentCode(), result.getReviewScore(), result.getDefenseScore(),
                result.getFinalScore(), result.isPassed(), true, result.getPublishedAt());
    }
}
