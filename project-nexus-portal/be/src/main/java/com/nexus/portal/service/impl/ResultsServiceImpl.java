package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.DefenseResultResponse;
import com.nexus.portal.dto.response.ResultStatisticsResponse;
import com.nexus.portal.enums.CouncilStatus;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.enums.ScoreRange;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.DepartmentRepository;
import com.nexus.portal.repository.DefenseAssignmentRepository;
import com.nexus.portal.repository.DefenseCouncilRepository;
import com.nexus.portal.repository.PublishedResultRepository;
import com.nexus.portal.repository.RegistrationPeriodRepository;
import com.nexus.portal.repository.ResultStatisticsRepository;
import com.nexus.portal.repository.TopicRepository;
import com.nexus.portal.service.AuditLogService;
import com.nexus.portal.service.CalculatedScore;
import com.nexus.portal.service.ResultPublicationService;
import com.nexus.portal.service.ResultStatisticsService;
import com.nexus.portal.service.ScoreCalculationService;
import com.nexus.portal.service.ScoreCalculationService.ScoreRangeClassifier;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ResultsServiceImpl implements ResultPublicationService, ResultStatisticsService {
    private final DefenseAssignmentRepository assignments;
    private final DefenseCouncilRepository councils;
    private final PublishedResultRepository results;
    private final ScoreCalculationService scoreCalculation;
    private final DefenseAccessPolicy access;
    private final AuditLogService audit;
    private final Clock clock;
    private final ResultStatisticsRepository reports;
    private final DepartmentRepository departments;
    private final RegistrationPeriodRepository periods;
    private final TopicRepository topics;

    public ResultsServiceImpl(DefenseAssignmentRepository assignments, DefenseCouncilRepository councils,
                              PublishedResultRepository results, ScoreCalculationService scoreCalculation,
                              DefenseAccessPolicy access, AuditLogService audit, Clock clock,
                              ResultStatisticsRepository reports, DepartmentRepository departments,
                              RegistrationPeriodRepository periods, TopicRepository topics) {
        this.assignments = assignments;
        this.councils = councils;
        this.results = results;
        this.scoreCalculation = scoreCalculation;
        this.access = access;
        this.audit = audit;
        this.clock = clock;
        this.reports = reports;
        this.departments = departments;
        this.periods = periods;
        this.topics = topics;
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
        if (results.existsByAssignmentId(assignmentId)) {
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

    @Override
    public ResultStatisticsResponse.Options getFilterOptions(String identifier) {
        User manager = access.getUser(identifier);
        List<Department> scope = getManagedDepartments(manager);
        List<Long> departmentIds = scope.stream().map(Department::getId).toList();
        List<ResultStatisticsResponse.Options.Option> departmentOptions = scope.stream()
                .sorted(Comparator.comparing(Department::getName))
                .map(department -> new ResultStatisticsResponse.Options.Option(
                        department.getId(), department.getName()))
                .toList();
        List<ResultStatisticsResponse.Options.Option> periodOptions = periods.findAll().stream()
                .sorted(Comparator.comparing(RegistrationPeriod::getStartDate).reversed())
                .map(period -> new ResultStatisticsResponse.Options.Option(period.getId(), period.getName()))
                .toList();
        List<ResultStatisticsResponse.Options.TopicOption> topicOptions = departmentIds.isEmpty() ? List.of()
                : topics.findByDepartmentIdIn(departmentIds).stream()
                .sorted(Comparator.comparing(Topic::getTitle))
                .map(topic -> new ResultStatisticsResponse.Options.TopicOption(topic.getId(), topic.getTitle(),
                        topic.getDepartment().getId(), topic.getPeriod().getId()))
                .toList();
        return new ResultStatisticsResponse.Options(periodOptions, departmentOptions, topicOptions);
    }

    @Override
    public List<ResultStatisticsResponse.Row> getStatistics(
            Long periodId, Long departmentId, Long topicId, String identifier) {
        User manager = access.getUser(identifier);
        Set<Long> allowedDepartmentIds = getManagedDepartments(manager).stream()
                .map(Department::getId)
                .collect(Collectors.toSet());
        if (departmentId != null && !allowedDepartmentIds.contains(departmentId)) {
            throw new AccessDeniedException("You do not have permission to view academic results for this department");
        }
        if (periodId != null && !periods.existsById(periodId)) {
            throw new ResourceNotFoundException("Registration period not found");
        }
        if (topicId != null) {
            Topic topic = topics.findById(topicId)
                    .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
            if (!allowedDepartmentIds.contains(topic.getDepartment().getId())) {
                throw new AccessDeniedException("You do not have permission to view academic results for this topic");
            }
        }

        Map<ReportKey, List<PublishedResult>> grouped = new HashMap<>();
        reports.findPublishedForReport(allowedDepartmentIds, periodId, departmentId, topicId)
                .forEach(result -> {
                    Topic topic = result.getAssignment().getRegistration().getTopic();
                    RegistrationPeriod period = topic.getPeriod();
                    Department department = topic.getDepartment();
                    ReportKey key = new ReportKey(period.getId(), period.getName(), department.getId(),
                            department.getName(), topic.getId(), topic.getTitle());
                    grouped.computeIfAbsent(key, ignored -> new ArrayList<>()).add(result);
                });

        return grouped.entrySet().stream()
                .map(entry -> toReportRow(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(ResultStatisticsResponse.Row::periodName)
                        .thenComparing(ResultStatisticsResponse.Row::departmentName)
                        .thenComparing(ResultStatisticsResponse.Row::topicTitle))
                .toList();
    }

    private ResultStatisticsResponse.Row toReportRow(ReportKey key, List<PublishedResult> rows) {
        BigDecimal total = rows.stream().map(PublishedResult::getFinalScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long passCount = rows.stream().filter(PublishedResult::isPassed).count();
        Map<String, Long> distribution = new LinkedHashMap<>();
        Arrays.stream(ScoreRange.values())
                .forEach(range -> distribution.put(ScoreRangeClassifier.labelOf(range), 0L));
        for (PublishedResult result : rows) {
            String label = ScoreRangeClassifier.labelOf(ScoreRangeClassifier.classify(result.getFinalScore()));
            distribution.merge(label, 1L, Long::sum);
        }
        return new ResultStatisticsResponse.Row(key.periodId(), key.periodName(), key.departmentId(),
                key.departmentName(), key.topicId(), key.topicTitle(), rows.size(),
                total.divide(BigDecimal.valueOf(rows.size()), 2, RoundingMode.HALF_UP),
                passCount, rows.size() - passCount, distribution);
    }

    private List<Department> getManagedDepartments(User manager) {
        if (!access.hasRole(manager, RoleName.ROLE_ADMIN)
                && !access.hasRole(manager, RoleName.ROLE_PRINCIPAL)) {
            throw new AccessDeniedException(
                    "Only administrators and assigned department heads can view academic results");
        }
        List<Department> scope = departments.findAll().stream()
                .filter(department -> access.canManage(manager, department))
                .toList();
        if (scope.isEmpty()) {
            throw new AccessDeniedException("You have not been assigned to manage any department");
        }
        return scope;
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

    private record ReportKey(Long periodId, String periodName, Long departmentId, String departmentName,
                             Long topicId, String topicTitle) {}
}