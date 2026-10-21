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
import com.nexus.portal.repository.ResultRepository;
import com.nexus.portal.repository.PublishedResultDetailsRepository;
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
    private static final BigDecimal ADVISOR_WEIGHT = new BigDecimal("0.20");
    private static final BigDecimal REVIEW_WEIGHT = new BigDecimal("0.30");
    private static final BigDecimal DEFENSE_WEIGHT = new BigDecimal("0.50");
    private static final BigDecimal PASSING_SCORE = new BigDecimal("5.00");

    private final AssessmentRepository assessments;
    private final DefenseAssignmentRepository assignments;
    private final TeamMemberRepository members;
    private final ResultRepository publishedResults;
    private final PublishedResultDetailsRepository publishedDetails;
    private final DefenseAccessPolicy access;

    public ScoreCalculationServiceImpl(AssessmentRepository assessments, DefenseAssignmentRepository assignments,
                                 TeamMemberRepository members, ResultRepository publishedResults,
                                 PublishedResultDetailsRepository publishedDetails, DefenseAccessPolicy access) {
        this.assessments = assessments;
        this.assignments = assignments;
        this.members = members;
        this.publishedResults = publishedResults;
        this.publishedDetails = publishedDetails;
        this.access = access;
    }

    @Override
    public List<ResultResponse.Defense> getAssignmentScores(Long assignmentId, String identifier) {
        User manager = access.getUser(identifier);
        DefenseAssignment assignment = assignments.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Defense assignment not found"));
        requireManager(manager, assignment.getRegistration().getTopic().getDepartment());
        List<Result> published = publishedResults.findByAssignmentIdOrderByStudentIdAsc(assignmentId);
        if (!published.isEmpty()) {
            var details = publishedDetails.findByIdIn(published.stream().map(Result::getId).toList()).stream()
                    .collect(java.util.stream.Collectors.toMap(detail -> detail.getId(), detail -> detail));
            return published.stream().map(result -> toResponse(result, details.get(result.getId()))).toList();
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
        // Council lecturers who also supervise this team are excluded from review/defense grading.
        java.util.Set<Long> eligibleEvaluatorIds = assignment.getCouncil().getMembers().stream()
                .map(DefenseCouncilMember::getLecturer)
                .filter(lecturer -> access.canAssessAsCouncilMember(lecturer, assignment.getRegistration()))
                .map(User::getId)
                .collect(java.util.stream.Collectors.toSet());
        int expectedDefenseAssessments = eligibleEvaluatorIds.size();
        if (expectedDefenseAssessments == 0) {
            throw new BadRequestException("The council has no eligible defense assessors");
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
            List<Assessment> advisorAssessments = studentAssessments.stream()
                    .filter(assessment -> assessment.getType() == AssessmentType.ADVISOR)
                    .toList();
            List<Assessment> defenses = studentAssessments.stream()
                    .filter(assessment -> assessment.getType() == AssessmentType.DEFENSE)
                    .filter(assessment -> eligibleEvaluatorIds.contains(assessment.getEvaluator().getId()))
                    .toList();
            if (advisorAssessments.size() != 1 || reviews.size() != 1
                    || defenses.size() != expectedDefenseAssessments) {
                throw new BadRequestException(
                        "Assessments for student " + student.getId() + " are incomplete");
            }
            CalculatedScore.AssessmentBreakdown advisor = breakdown(advisorAssessments);
            CalculatedScore.AssessmentBreakdown reviewer = breakdown(reviews);
            CalculatedScore.AssessmentBreakdown defense = breakdown(defenses);
            BigDecimal finalScore = calculateFinalScore(advisor.score(), reviewer.score(), defense.score());
            calculatedScores.add(new CalculatedScore(student, advisor, reviewer, defense,
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

    static BigDecimal calculateFinalScore(BigDecimal advisorScore, BigDecimal reviewScore,
                                          BigDecimal defenseScore) {
        return advisorScore.multiply(ADVISOR_WEIGHT)
                .add(reviewScore.multiply(REVIEW_WEIGHT))
                .add(defenseScore.multiply(DEFENSE_WEIGHT))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private CalculatedScore.AssessmentBreakdown breakdown(List<Assessment> values) {
        return new CalculatedScore.AssessmentBreakdown(averageAssessments(values),
                averageCriterion(values, Assessment::getContentScore),
                averageCriterion(values, Assessment::getImplementationScore),
                averageCriterion(values, Assessment::getPresentationScore),
                values.get(0).getEvaluator().getFullName(),
                values.stream().filter(value -> value.getComment() != null && !value.getComment().isBlank())
                        .map(value -> values.size() == 1 ? value.getComment()
                                : value.getEvaluator().getFullName() + ": " + value.getComment())
                        .collect(java.util.stream.Collectors.joining("\n")));
    }

    private BigDecimal averageCriterion(List<Assessment> values,
                                       java.util.function.Function<Assessment, BigDecimal> criterion) {
        return values.stream().map(value -> criterion.apply(value))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
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
                score.student().getFullName(), score.student().getStudentCode(), score.advisor().score(),
                score.reviewer().score(), score.defense().score(),
                score.advisor().contentScore(), score.advisor().implementationScore(), score.advisor().presentationScore(),
                score.reviewer().contentScore(), score.reviewer().implementationScore(), score.reviewer().presentationScore(),
                score.defense().contentScore(), score.defense().implementationScore(), score.defense().presentationScore(),
                score.advisor().evaluatorName(), score.advisor().comment(), score.reviewer().comment(),
                score.defense().comment(), score.finalScore(), score.passed(), published, publishedAt);
    }

    private ResultResponse.Defense toResponse(Result result,
                                              com.nexus.portal.model.PublishedResultDetails details) {
        DefenseAssignment assignment = result.getAssignment();
        Topic topic = assignment.getRegistration().getTopic();
        User student = result.getStudent();
        return new ResultResponse.Defense(assignment.getId(), assignment.getRegistration().getId(),
                topic.getPeriod().getId(), topic.getPeriod().getName(), topic.getDepartment().getId(),
                topic.getDepartment().getName(), topic.getId(), topic.getTitle(),
                assignment.getRegistration().getTeam().getName(), student.getId(), student.getFullName(), student.getStudentCode(),
                details == null ? null : average(details.getAdvisorContentScore(), details.getAdvisorImplementationScore(), details.getAdvisorPresentationScore()),
                result.getReviewScore(), result.getDefenseScore(),
                details == null ? null : details.getAdvisorContentScore(),
                details == null ? null : details.getAdvisorImplementationScore(),
                details == null ? null : details.getAdvisorPresentationScore(),
                details == null ? null : details.getReviewContentScore(),
                details == null ? null : details.getReviewImplementationScore(),
                details == null ? null : details.getReviewPresentationScore(),
                details == null ? null : details.getDefenseContentScore(),
                details == null ? null : details.getDefenseImplementationScore(),
                details == null ? null : details.getDefensePresentationScore(),
                details == null ? null : details.getAdvisorName(),
                details == null ? null : details.getAdvisorComment(),
                details == null ? null : details.getReviewComment(),
                details == null ? null : details.getDefenseComments(),
                result.getFinalScore(), result.isPassed(), true, result.getPublishedAt());
    }

    private BigDecimal average(BigDecimal first, BigDecimal second, BigDecimal third) {
        return first.add(second).add(third).divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
    }
}
