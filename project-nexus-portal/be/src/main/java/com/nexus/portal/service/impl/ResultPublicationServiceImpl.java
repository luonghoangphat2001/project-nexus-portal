package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.DefenseResultResponse;
import com.nexus.portal.enums.CouncilStatus;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.DefenseAssignmentRepository;
import com.nexus.portal.repository.DefenseCouncilRepository;
import com.nexus.portal.repository.PublishedResultReadRepository;
import com.nexus.portal.repository.PublishedResultRepository;
import com.nexus.portal.service.AuditLogService;
import com.nexus.portal.service.CalculatedScore;
import com.nexus.portal.service.ScoreCalculationService;
import com.nexus.portal.service.ResultPublicationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ResultPublicationServiceImpl implements ResultPublicationService {
    private final DefenseAssignmentRepository assignments;
    private final DefenseCouncilRepository councils;
    private final PublishedResultReadRepository publishedResultsReader;
    private final PublishedResultRepository results;
    private final ScoreCalculationService scoreCalculation;
    private final DefenseAccessPolicy access;
    private final AuditLogService audit;
    private final Clock clock;

    public ResultPublicationServiceImpl(DefenseAssignmentRepository assignments, DefenseCouncilRepository councils,
                                  PublishedResultReadRepository publishedResultsReader, PublishedResultRepository results,
                                  ScoreCalculationService scoreCalculation, DefenseAccessPolicy access,
                                  AuditLogService audit, Clock clock) {
        this.assignments = assignments;
        this.councils = councils;
        this.publishedResultsReader = publishedResultsReader;
        this.results = results;
        this.scoreCalculation = scoreCalculation;
        this.access = access;
        this.audit = audit;
        this.clock = clock;
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<DefenseResultResponse> publishAssignmentResults(Long assignmentId, String identifier) {
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
        if (publishedResultsReader.existsByAssignmentId(assignmentId)) {
            throw new BadRequestException("Results for this assignment have already been published");
        }

        LocalDateTime publishedAt = LocalDateTime.now(clock);
        List<CalculatedScore> calculatedScores = scoreCalculation.calculateScores(assignment);
        List<PublishedResult> published = calculatedScores.stream().map(score -> {
            PublishedResult result = new PublishedResult();
            result.setAssignment(assignment);
            result.setStudent(score.student());
            result.setReviewScore(score.reviewScore());
            result.setDefenseScore(score.defenseScore());
            result.setFinalScore(score.finalScore());
            result.setPassed(score.passed());
            result.setPublishedBy(manager);
            result.setPublishedAt(publishedAt);
            return result;
        }).toList();
        List<PublishedResult> saved = results.saveAllAndFlush(published);
        audit.log(manager.getId(), manager.getUsername(), "PUBLISH_RESULTS",
                "results/assignments/" + assignmentId,
                "Published " + saved.size() + " results for registration "
                        + assignment.getRegistration().getId(), null, null, "SUCCESS");
        return saved.stream().map(this::toResponse).toList();
    }

    @Override
    public List<DefenseResultResponse> getMyPublishedResults(String identifier) {
        User student = access.getUser(identifier);
        if (!access.hasRole(student, RoleName.ROLE_USER)) {
            throw new AccessDeniedException("Only students can view their own results");
        }
        return results.findByStudentIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(student.getId())
                .stream().map(this::toResponse).toList();
    }

    private void requireManager(User user, Department department) {
        if (!access.canManage(user, department)) {
            throw new AccessDeniedException("You do not have permission to manage results for this department");
        }
    }

    private DefenseAssignment getAssignment(Long assignmentId) {
        return assignments.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Defense assignment not found"));
    }

    private DefenseResultResponse toResponse(PublishedResult result) {
        DefenseAssignment assignment = result.getAssignment();
        Topic topic = assignment.getRegistration().getTopic();
        User student = result.getStudent();
        return new DefenseResultResponse(assignment.getId(), assignment.getRegistration().getId(),
                topic.getPeriod().getId(), topic.getPeriod().getName(), topic.getDepartment().getId(),
                topic.getDepartment().getName(), topic.getId(), topic.getTitle(),
                assignment.getRegistration().getTeam().getName(), student.getId(), student.getFullName(),
                student.getStudentCode(), result.getReviewScore(), result.getDefenseScore(),
                result.getFinalScore(), result.isPassed(), true, result.getPublishedAt());
    }

}
