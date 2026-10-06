package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.AssessmentRequest;
import com.nexus.portal.dto.response.AssessmentResponse;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.*;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AssessmentServiceImpl implements AssessmentService {
    private final AssessmentRepository assessments;
    private final DefenseAssignmentRepository assignments;
    private final DefenseCouncilRepository councils;
    private final TeamMemberRepository members;
    private final ReportDocumentRepository documents;
    private final DefenseAccessPolicy access;
    private final AuditLogService audit;
    private final Clock clock;

    public AssessmentServiceImpl(AssessmentRepository assessments, DefenseAssignmentRepository assignments,
                                 DefenseCouncilRepository councils, TeamMemberRepository members,
                                 ReportDocumentRepository documents, DefenseAccessPolicy access,
                                 AuditLogService audit, Clock clock) {
        this.assessments = assessments;
        this.assignments = assignments;
        this.councils = councils;
        this.members = members;
        this.documents = documents;
        this.access = access;
        this.audit = audit;
        this.clock = clock;
    }

    @Override
    public List<AssessmentResponse> getAssessments(Long assignmentId, String identifier) {
        User user = access.getUser(identifier);
        DefenseAssignment assignment = getAssignment(assignmentId);
        boolean manager = access.canManage(user, assignment.getCouncil().getDepartment());
        if (!manager && !access.isCouncilMember(user, assignment.getCouncil())) {
            throw new AccessDeniedException("Only council members and authorized managers can view assessments before scores are published");
        }
        return assessments.findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(assignmentId).stream()
                .filter(s -> s.getEvaluator().getId().equals(user.getId()) || s.getStatus() == AssessmentStatus.SUBMITTED)
                .map(s -> toResponse(s, user)).toList();
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AssessmentResponse saveDraft(AssessmentRequest request, String identifier) {
        User user = access.getUser(identifier);
        lockAssignmentCouncil(request.assignmentId());
        DefenseAssignment assignment = getAssignment(request.assignmentId());
        requireEvaluator(user, assignment, request.type());
        User student = members.findByTeamIdAndUserId(assignment.getRegistration().getTeam().getId(), request.studentId())
                .orElseThrow(() -> new BadRequestException("The student does not belong to the assigned team")).getUser();
        Assessment score = assessments.findByAssignmentIdAndEvaluatorIdAndStudentIdAndType(
                assignment.getId(), user.getId(), student.getId(), request.type()).orElseGet(Assessment::new);
        if (score.getStatus() == AssessmentStatus.SUBMITTED) throw new BadRequestException("Submitted assessments are locked and cannot be edited");
        score.setAssignment(assignment);
        score.setEvaluator(user);
        score.setStudent(student);
        score.setType(request.type());
        score.setContentScore(request.contentScore());
        score.setImplementationScore(request.implementationScore());
        score.setPresentationScore(request.presentationScore());
        score.setStrengths(request.strengths());
        score.setWeaknesses(request.weaknesses());
        score.setQuestions(request.questions());
        score.setComment(request.comment());
        return toResponse(assessments.saveAndFlush(score), user);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AssessmentResponse submitAssessment(Long id, String identifier) {
        User user = access.getUser(identifier);
        Assessment score = getLockedAssessment(id);
        requireOwner(user, score);
        requireEvaluator(user, score.getAssignment(), score.getType());
        if (score.getStatus() != AssessmentStatus.DRAFT) throw new BadRequestException("The assessment has already been submitted");
        if (score.getComment() == null || score.getComment().isBlank()) throw new BadRequestException("Comments are required before submitting an assessment");
        if (score.getType() == AssessmentType.DEFENSE && LocalDateTime.now(clock).isBefore(score.getAssignment().getCouncil().getStartsAt())) {
            throw new BadRequestException("The defense has not started yet; only draft assessments can be saved");
        }
        access.getRegistration(score.getAssignment().getRegistration().getId(), true);
        if (documents.findLastVersion(score.getAssignment().getRegistration().getId(), DocumentType.REPORT) == 0) {
            throw new BadRequestException("The team has not submitted a report; assessments cannot be submitted yet");
        }
        score.setStatus(AssessmentStatus.SUBMITTED);
        score.setSubmittedAt(LocalDateTime.now(clock));
        assessments.saveAndFlush(score);
        audit.log(user.getId(), user.getUsername(), "SUBMIT_ASSESSMENT", "assessments/" + id,
                "Submitted " + score.getType() + " for student " + score.getStudent().getId(), null, null, "SUCCESS");
        return toResponse(score, user);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void deleteDraft(Long id, String identifier) {
        User user = access.getUser(identifier);
        Assessment score = getLockedAssessment(id);
        requireOwner(user, score);
        if (score.getStatus() != AssessmentStatus.DRAFT) throw new BadRequestException("Only draft assessments can be deleted");
        if (score.getAssignment().getCouncil().getStatus() == CouncilStatus.COMPLETED) throw new BadRequestException("The council has been completed");
        assessments.delete(score);
    }

    private void lockAssignmentCouncil(Long assignmentId) {
        Long councilId = assignments.findCouncilIdById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Defense assignment not found"));
        councils.findLockedById(councilId).orElseThrow(() -> new ResourceNotFoundException("Council not found"));
    }

    private Assessment getLockedAssessment(Long id) {
        // Read only the council ID before locking, then hydrate the assessment after the lock.
        // This avoids stale first-level-cache state when submit/edit/delete race each other.
        Long councilId = assessments.findCouncilIdById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));
        councils.findLockedById(councilId).orElseThrow(() -> new ResourceNotFoundException("Council not found"));
        return getAssessment(id);
    }

    private void requireEvaluator(User user, DefenseAssignment assignment, AssessmentType type) {
        if (assignment.getCouncil().getStatus() != CouncilStatus.SCHEDULED) throw new BadRequestException("The council has been completed or cancelled");
        DefenseCouncilMember member = assignment.getCouncil().getMembers().stream()
                .filter(m -> m.getLecturer().getId().equals(user.getId())).findFirst()
                .orElseThrow(() -> new AccessDeniedException("You are not assigned to this council"));
        if (type == AssessmentType.REVIEW && (member.getRole() != CouncilMemberRole.REVIEWER
                || access.isAdvisor(user, assignment.getRegistration()))) {
            throw new AccessDeniedException("Only the assigned reviewer can create review assessments");
        }
    }

    private void requireOwner(User user, Assessment score) {
        if (!score.getEvaluator().getId().equals(user.getId())) throw new AccessDeniedException("You cannot modify another evaluator's assessment");
    }

    private DefenseAssignment getAssignment(Long id) {
        return assignments.findById(id).orElseThrow(() -> new ResourceNotFoundException("Defense assignment not found"));
    }

    private Assessment getAssessment(Long id) {
        return assessments.findById(id).orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));
    }

    private AssessmentResponse toResponse(Assessment s, User user) {
        return new AssessmentResponse(s.getId(), s.getAssignment().getId(), s.getEvaluator().getId(), s.getEvaluator().getFullName(),
                s.getStudent().getId(), s.getStudent().getFullName(), s.getType(), s.getStatus(), s.getContentScore(),
                s.getImplementationScore(), s.getPresentationScore(), s.getStrengths(), s.getWeaknesses(), s.getQuestions(),
                s.getComment(), s.getSubmittedAt(), s.getUpdatedAt(), s.getStatus() == AssessmentStatus.DRAFT
                && s.getEvaluator().getId().equals(user.getId()) && s.getAssignment().getCouncil().getStatus() == CouncilStatus.SCHEDULED);
    }
}
