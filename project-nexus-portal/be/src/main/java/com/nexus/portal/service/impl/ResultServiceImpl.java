package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.ResultResponse;
import com.nexus.portal.enums.AdvisorRole;
import com.nexus.portal.enums.CouncilStatus;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.enums.ScoreRange;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.DepartmentRepository;
import com.nexus.portal.repository.DefenseAssignmentRepository;
import com.nexus.portal.repository.DefenseCouncilRepository;
import com.nexus.portal.repository.ResultRepository;
import com.nexus.portal.repository.PublishedResultDetailsRepository;
import com.nexus.portal.repository.RegistrationPeriodRepository;
import com.nexus.portal.repository.TopicRepository;
import com.nexus.portal.service.AuditLogService;
import com.nexus.portal.service.CalculatedScore;
import com.nexus.portal.service.ResultService;
import com.nexus.portal.service.NotificationService;
import com.nexus.portal.service.ScoreCalculationService;
import com.nexus.portal.service.ScoreCalculationService.ScoreRangeClassifier;
import org.springframework.beans.factory.annotation.Autowired;
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
public class ResultServiceImpl implements ResultService {
    private final DefenseAssignmentRepository assignments;
    private final DefenseCouncilRepository councils;
    private final ResultRepository results;
    private final PublishedResultDetailsRepository resultDetails;
    private final ScoreCalculationService scoreCalculation;
    private final DefenseAccessPolicy access;
    private final AuditLogService audit;
    private final Clock clock;
    private final DepartmentRepository departments;
    private final RegistrationPeriodRepository periods;
    private final TopicRepository topics;
    private final NotificationService notificationService;

    @Autowired
    public ResultServiceImpl(DefenseAssignmentRepository assignments, DefenseCouncilRepository councils,
                              ResultRepository results, PublishedResultDetailsRepository resultDetails,
                              ScoreCalculationService scoreCalculation,
                              DefenseAccessPolicy access, AuditLogService audit, Clock clock,
                              DepartmentRepository departments, RegistrationPeriodRepository periods,
                              TopicRepository topics, NotificationService notificationService) {
        this.assignments = assignments;
        this.councils = councils;
        this.results = results;
        this.resultDetails = resultDetails;
        this.scoreCalculation = scoreCalculation;
        this.access = access;
        this.audit = audit;
        this.clock = clock;
        this.departments = departments;
        this.periods = periods;
        this.topics = topics;
        this.notificationService = notificationService;
    }

    public ResultServiceImpl(DefenseAssignmentRepository assignments, DefenseCouncilRepository councils,
                              ResultRepository results, PublishedResultDetailsRepository resultDetails,
                              ScoreCalculationService scoreCalculation,
                              DefenseAccessPolicy access, AuditLogService audit, Clock clock,
                              DepartmentRepository departments, RegistrationPeriodRepository periods,
                              TopicRepository topics) {
        this(assignments, councils, results, resultDetails, scoreCalculation, access, audit, clock, departments, periods, topics, null);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<ResultResponse.Defense> publishAssignmentResults(Long assignmentId, String identifier) {
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
        if (council.getEndsAt() != null && LocalDateTime.now(clock).isBefore(council.getEndsAt())) {
            throw new BadRequestException("Results can only be published after the scheduled defense has ended");
        }
        if (results.existsByAssignmentId(assignmentId)) {
            throw new BadRequestException("Results have already been published for this assignment.");
        }

        LocalDateTime publishedAt = LocalDateTime.now(clock);
        List<CalculatedScore> calculatedScores = scoreCalculation.calculateScores(assignment);
        List<Result> published = calculatedScores.stream().map(score -> {
            Result result = new Result();
            result.setAssignment(assignment);
            result.setStudent(score.student());
            result.setReviewScore(score.reviewer().score());
            result.setDefenseScore(score.defense().score());
            result.setFinalScore(score.finalScore());
            result.setPassed(score.passed());
            result.setPublishedBy(manager);
            result.setPublishedAt(publishedAt);
            return result;
        }).toList();
        List<Result> saved = results.saveAllAndFlush(published);
        List<com.nexus.portal.model.PublishedResultDetails> detailsToSave =
                java.util.stream.IntStream.range(0, saved.size())
                .mapToObj(index -> com.nexus.portal.model.PublishedResultDetails.from(
                        saved.get(index), calculatedScores.get(index)))
                .toList();
        List<com.nexus.portal.model.PublishedResultDetails> snapshots =
                resultDetails.saveAllAndFlush(detailsToSave);
        audit.log(manager.getId(), manager.getUsername(), "PUBLISH_RESULTS",
                "results/assignments/" + assignmentId,
                "Published " + saved.size() + " results for registration "
                        + assignment.getRegistration().getId(), null, null, "SUCCESS");
        Map<Long, com.nexus.portal.model.PublishedResultDetails> savedDetails = snapshots.stream()
                .collect(Collectors.toMap(com.nexus.portal.model.PublishedResultDetails::getId, detail -> detail));

        if (notificationService != null) {
            String topicTitle = assignment.getRegistration() != null && assignment.getRegistration().getTopic() != null
                    ? assignment.getRegistration().getTopic().getTitle() : "Khóa luận tốt nghiệp";
            for (Result r : saved) {
                if (r.getStudent() != null) {
                    String statusVi = r.isPassed() ? "Đạt" : "Không đạt";
                    String statusEn = r.isPassed() ? "Passed" : "Failed";
                    notificationService.sendNotification(
                            r.getStudent(),
                            manager,
                            "[VI] Điểm bảo vệ khóa luận: " + topicTitle + " | [EN] Defense evaluation results: " + topicTitle,
                            "[VI] Kết quả bảo vệ đề tài \"" + topicTitle + "\" đã được công bố. Điểm tổng kết: "
                                    + r.getFinalScore() + " (" + statusVi
                                    + "). Vui lòng vào mục Kết quả bảo vệ để xem chi tiết nhận xét của hội đồng.\n"
                                    + "[EN] Defense results for topic \"" + topicTitle + "\" have been published. Final score: "
                                    + r.getFinalScore() + " (" + statusEn
                                    + "). Please check the Defense Results page to view detailed council evaluations."
                    );
                }
            }

            // Also notify advisor lecturers of the topic
            Topic topic = assignment.getRegistration() != null ? assignment.getRegistration().getTopic() : null;
            if (topic != null && topic.getTopicLecturers() != null) {
                String teamName = (assignment.getRegistration() != null && assignment.getRegistration().getTeam() != null)
                        ? assignment.getRegistration().getTeam().getName()
                        : "";
                for (com.nexus.portal.model.TopicLecturer tl : topic.getTopicLecturers()) {
                    if (tl.getLecturer() != null) {
                        notificationService.sendNotification(
                                tl.getLecturer(),
                                manager,
                                "[VI] Đề tài hướng dẫn đã có điểm bảo vệ: " + topicTitle + " | [EN] Defense evaluation results for advised topic: " + topicTitle,
                                "[VI] Hội đồng đã hoàn tất chấm điểm và công bố kết quả cho đề tài \"" + topicTitle + "\""
                                        + (!teamName.isBlank() ? (" của nhóm \"" + teamName + "\"") : "")
                                        + ". Vui lòng vào mục Kết quả bảo vệ để xem chi tiết bảng điểm.\n"
                                        + "[EN] The defense council has evaluated and published results for topic \"" + topicTitle + "\""
                                        + (!teamName.isBlank() ? (" by team \"" + teamName + "\"") : "")
                                        + ". Please visit the Defense Results page to view the score sheet."
                        );
                    }
                }
            }
        }

        return saved.stream().map(result -> toResponse(result, savedDetails.get(result.getId()))).toList();
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<ResultResponse.Defense> republishAssignmentResults(Long assignmentId, String reason, String identifier) {
        // Module 15: allow staff to correct mistakes after publication. The old snapshot is removed
        // and the regular publish flow recalculates from the current assessments. If recalculation
        // fails (e.g. incomplete assessments), the transaction rolls back and the old snapshot stays.
        User manager = access.getUser(identifier);
        DefenseAssignment assignment = getAssignment(assignmentId);
        requireManager(manager, assignment.getRegistration().getTopic().getDepartment());
        List<Result> existing = results.findByAssignmentIdOrderByStudentIdAsc(assignmentId);
        if (existing.isEmpty()) {
            throw new BadRequestException("No published results to adjust; use the regular publish action instead");
        }
        resultDetails.deleteAllById(existing.stream().map(Result::getId).toList());
        results.deleteAll(existing);
        results.flush();
        audit.log(manager.getId(), manager.getUsername(), "REPUBLISH_RESULTS",
                "results/assignments/" + assignmentId,
                "Re-publishing " + existing.size() + " published results for registration "
                        + assignment.getRegistration().getId()
                        + (reason != null && !reason.isBlank() ? ". Reason: " + reason : ""),
                null, null, "SUCCESS");
        return publishAssignmentResults(assignmentId, identifier);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ResultResponse.Defense adjustPublishedResult(Long assignmentId, Long studentId,
            BigDecimal advisorScore, BigDecimal reviewScore, BigDecimal defenseScore, String reason, String identifier) {
        User manager = access.getUser(identifier);
        Long councilId = assignments.findCouncilIdById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Defense assignment not found"));
        councils.findLockedById(councilId).orElseThrow(() -> new ResourceNotFoundException("Council not found"));
        DefenseAssignment assignment = getAssignment(assignmentId);
        requireManager(manager, assignment.getRegistration().getTopic().getDepartment());
        if (reason == null || reason.isBlank()) throw new BadRequestException("An adjustment reason is required");
        if (advisorScore == null && reviewScore == null && defenseScore == null) {
            throw new BadRequestException("No score changes were provided");
        }
        validateScore(advisorScore);
        validateScore(reviewScore);
        validateScore(defenseScore);
        Result result = results.findByAssignmentIdOrderByStudentIdAsc(assignmentId).stream()
                .filter(value -> value.getStudent().getId().equals(studentId) && value.getPublishedAt() != null)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No published result found for this student"));
        com.nexus.portal.model.PublishedResultDetails details = resultDetails.findById(result.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Published result details not found"));

        BigDecimal oldAdvisor = average(details.getAdvisorContentScore(), details.getAdvisorImplementationScore(),
                details.getAdvisorPresentationScore());
        BigDecimal oldReview = result.getReviewScore();
        BigDecimal oldDefense = result.getDefenseScore();
        BigDecimal oldFinal = result.getFinalScore();
        BigDecimal advisor = advisorScore != null ? advisorScore : oldAdvisor;
        BigDecimal review = reviewScore != null ? reviewScore : oldReview;
        BigDecimal defense = defenseScore != null ? defenseScore : oldDefense;
        BigDecimal finalScore = ScoreCalculationServiceImpl.calculateFinalScore(advisor, review, defense);

        if (advisorScore != null) {
            details.setAdvisorContentScore(advisorScore);
            details.setAdvisorImplementationScore(advisorScore);
            details.setAdvisorPresentationScore(advisorScore);
        }
        result.setReviewScore(review);
        result.setDefenseScore(defense);
        result.setFinalScore(finalScore);
        result.setPassed(ScoreCalculationServiceImpl.isPassingScore(finalScore));
        results.saveAndFlush(result);
        resultDetails.saveAndFlush(details);
        audit.log(manager.getId(), manager.getUsername(), "ADJUST_RESULT", "results/" + result.getId(),
                "Adjusted result of student " + studentId + ": advisor " + oldAdvisor + " -> " + advisor
                        + ", review " + oldReview + " -> " + review + ", defense " + oldDefense + " -> " + defense
                        + ", final " + oldFinal + " -> " + finalScore + ". Reason: " + reason,
                null, null, "SUCCESS");

        if (notificationService != null && result.getStudent() != null) {
            notificationService.sendNotification(
                    result.getStudent(),
                    manager,
                    "[VI] Kết quả khóa luận đã được điều chỉnh | [EN] Thesis result adjusted",
                    "[VI] Cán bộ vừa điều chỉnh kết quả khóa luận của bạn. Điểm tổng kết mới: " + finalScore
                            + ". Lý do: " + reason + "\n"
                            + "[EN] Your thesis result was adjusted by staff. New final score: " + finalScore
                            + ". Reason: " + reason);
        }
        return toResponse(result, details);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<ResultResponse.Defense> publishPeriodResults(Long periodId, String identifier) {
        User manager = access.getUser(identifier);
        if (!periods.existsById(periodId)) {
            throw new ResourceNotFoundException("Registration period not found");
        }
        List<DefenseAssignment> pending = assignments.findUnpublishedCompletedByPeriodId(periodId).stream()
                .filter(assignment -> assignment.getCouncil().getEndsAt() == null
                        || !LocalDateTime.now(clock).isBefore(assignment.getCouncil().getEndsAt()))
                .filter(assignment -> access.canManage(manager,
                        assignment.getRegistration().getTopic().getDepartment()))
                .toList();
        if (pending.isEmpty()) {
            throw new BadRequestException("There are no completed councils waiting for result publication in this period");
        }
        List<ResultResponse.Defense> published = new ArrayList<>();
        pending.forEach(assignment -> published.addAll(publishAssignmentResults(assignment.getId(), identifier)));
        return published;
    }

    @Override
    public List<ResultResponse.Defense> getMyPublishedResults(String identifier) {
        User student = access.getUser(identifier);
        if (!access.hasRole(student, RoleName.ROLE_USER)) {
            throw new AccessDeniedException("Only students can view their own results");
        }
        return responsesWithDetails(
                results.findByStudentIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(student.getId()).stream()
                        .filter(this::councilHasEnded)
                        .toList());
    }

    @Override
    public ResultResponse.Statistics.Options getFilterOptions(String identifier) {
        User user = access.getUser(identifier);
        List<DefenseAssignment> councilScope = getCouncilScope(user);
        List<Department> scope = councilScope == null ? getManagedDepartments(user)
                : councilScope.stream().map(a -> a.getRegistration().getTopic().getDepartment()).distinct().toList();
        Set<Long> departmentIds = scope.stream().map(Department::getId).collect(Collectors.toSet());
        List<ResultResponse.Statistics.Options.Option> departmentOptions = scope.stream()
                .sorted(Comparator.comparing(Department::getName))
                .map(department -> new ResultResponse.Statistics.Options.Option(
                        department.getId(), department.getName()))
                .toList();
        List<RegistrationPeriod> periodScope = councilScope == null ? periods.findAll()
                : councilScope.stream().map(a -> a.getRegistration().getTopic().getPeriod()).distinct().toList();
        List<ResultResponse.Statistics.Options.Option> periodOptions = periodScope.stream()
                .sorted(Comparator.comparing(RegistrationPeriod::getStartDate).reversed())
                .map(period -> new ResultResponse.Statistics.Options.Option(period.getId(), period.getName()))
                .toList();
        List<Topic> topicScope = councilScope == null
                ? (departmentIds.isEmpty() ? List.of() : topics.findByDepartmentIdIn(departmentIds))
                : councilScope.stream().map(a -> a.getRegistration().getTopic()).distinct().toList();
        List<ResultResponse.Statistics.Options.TopicOption> topicOptions = topicScope.stream()
                .sorted(Comparator.comparing(Topic::getTitle))
                .map(topic -> new ResultResponse.Statistics.Options.TopicOption(topic.getId(), topic.getTitle(),
                        topic.getDepartment().getId(), topic.getPeriod().getId()))
                .toList();
        return new ResultResponse.Statistics.Options(periodOptions, departmentOptions, topicOptions);
    }

    @Override
    public List<ResultResponse.Statistics.Row> getStatistics(
            Long periodId, Long departmentId, Long topicId, String identifier) {
        User user = access.getUser(identifier);
        List<DefenseAssignment> councilScope = getCouncilScope(user);
        Set<Long> allowedDepartmentIds = (councilScope == null ? getManagedDepartments(user)
                : councilScope.stream().map(a -> a.getRegistration().getTopic().getDepartment()).distinct().toList()).stream()
                .map(Department::getId).collect(Collectors.toSet());
        Set<Long> allowedPeriodIds = (councilScope == null ? periods.findAll()
                : councilScope.stream().map(a -> a.getRegistration().getTopic().getPeriod()).distinct().toList()).stream()
                .map(RegistrationPeriod::getId).collect(Collectors.toSet());
        Set<Long> allowedTopicIds = (councilScope == null ? topics.findByDepartmentIdIn(allowedDepartmentIds)
                : councilScope.stream().map(a -> a.getRegistration().getTopic()).distinct().toList()).stream()
                .map(Topic::getId).collect(Collectors.toSet());
        if (departmentId != null && !allowedDepartmentIds.contains(departmentId)) {
            throw new AccessDeniedException("You do not have permission to view academic results for this department");
        }
        if (periodId != null && !allowedPeriodIds.contains(periodId)) {
            throw new ResourceNotFoundException("Registration period not found");
        }
        if (topicId != null && !allowedTopicIds.contains(topicId)) {
            if (councilScope != null) {
                throw new AccessDeniedException("You do not have permission to view academic results for this topic");
            }
            Topic topic = topics.findById(topicId)
                    .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
            if (!allowedDepartmentIds.contains(topic.getDepartment().getId())) {
                throw new AccessDeniedException("You do not have permission to view academic results for this topic");
            }
        }

        List<Result> scopedResults = councilScope == null
                ? results.findPublishedForReport(allowedDepartmentIds, periodId, departmentId, topicId)
                : results.findPublishedForReportByAssignmentIds(
                        councilScope.stream().map(DefenseAssignment::getId).toList(), periodId, departmentId, topicId);
        Map<ReportKey, List<Result>> grouped = new HashMap<>();
        scopedResults
                .stream()
                .filter(this::councilHasEnded)
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
                .sorted(Comparator.comparing(ResultResponse.Statistics.Row::periodName)
                        .thenComparing(ResultResponse.Statistics.Row::departmentName)
                        .thenComparing(ResultResponse.Statistics.Row::topicTitle))
                .toList();
    }

    @Override
    public List<ResultResponse.Statistics.DetailRow> getDetailedReport(
            Long periodId, Long departmentId, Long topicId, String identifier) {
        getStatistics(periodId, departmentId, topicId, identifier);
        User user = access.getUser(identifier);
        List<DefenseAssignment> councilScope = getCouncilScope(user);
        Set<Long> allowedDepartmentIds = (councilScope == null ? getManagedDepartments(user)
                : councilScope.stream().map(a -> a.getRegistration().getTopic().getDepartment()).distinct().toList()).stream()
                .map(Department::getId).collect(Collectors.toSet());
        List<Result> published = (councilScope == null
                ? results.findPublishedForReport(allowedDepartmentIds, periodId, departmentId, topicId)
                : results.findPublishedForReportByAssignmentIds(
                        councilScope.stream().map(DefenseAssignment::getId).toList(), periodId, departmentId, topicId)).stream()
                .filter(this::councilHasEnded)
                .toList();
        Map<Long, com.nexus.portal.model.PublishedResultDetails> details = resultDetails
                .findByIdIn(published.stream().map(Result::getId).toList()).stream()
                .collect(Collectors.toMap(com.nexus.portal.model.PublishedResultDetails::getId, value -> value));
        return published.stream().map(result -> {
            Topic topic = result.getAssignment().getRegistration().getTopic();
            User student = result.getStudent();
            Team team = result.getAssignment().getRegistration().getTeam();
            var detail = details.get(result.getId());
            return new ResultResponse.Statistics.DetailRow(
                    topic.getPeriod().getName(), topic.getDepartment().getName(), topic.getTitle(), team.getName(),
                    student.getStudentCode(), student.getFullName(),
                    detail == null ? "" : detail.getAdvisorName(),
                    detail == null ? null : average(detail.getAdvisorContentScore(), detail.getAdvisorImplementationScore(), detail.getAdvisorPresentationScore()),
                    detail == null ? null : detail.getAdvisorContentScore(),
                    detail == null ? null : detail.getAdvisorImplementationScore(),
                    detail == null ? null : detail.getAdvisorPresentationScore(),
                    result.getReviewScore(),
                    detail == null ? null : detail.getReviewContentScore(),
                    detail == null ? null : detail.getReviewImplementationScore(),
                    detail == null ? null : detail.getReviewPresentationScore(),
                    result.getDefenseScore(),
                    detail == null ? null : detail.getDefenseContentScore(),
                    detail == null ? null : detail.getDefenseImplementationScore(),
                    detail == null ? null : detail.getDefensePresentationScore(),
                    result.getFinalScore(), result.isPassed(),
                    detail == null ? null : detail.getAdvisorComment(),
                    detail == null ? null : detail.getReviewComment(),
                    detail == null ? null : detail.getDefenseComments());
        }).toList();
    }

    private void validateScore(BigDecimal score) {
        if (score != null && (score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(BigDecimal.TEN) > 0)) {
            throw new BadRequestException("Scores must be between 0 and 10");
        }
    }

    private BigDecimal average(BigDecimal content, BigDecimal implementation, BigDecimal presentation) {
        return content.add(implementation).add(presentation)
                .divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
    }

    private List<ResultResponse.Defense> responsesWithDetails(List<Result> values) {
        Map<Long, com.nexus.portal.model.PublishedResultDetails> snapshots = resultDetails
                .findByIdIn(values.stream().map(Result::getId).toList()).stream()
                .collect(Collectors.toMap(com.nexus.portal.model.PublishedResultDetails::getId, value -> value));
        return values.stream().map(result -> toResponse(result, snapshots.get(result.getId()))).toList();
    }

    private boolean councilHasEnded(Result result) {
        LocalDateTime endsAt = result.getAssignment().getCouncil().getEndsAt();
        return endsAt == null || !LocalDateTime.now(clock).isBefore(endsAt);
    }

    private ResultResponse.Statistics.Row toReportRow(ReportKey key, List<Result> rows) {
        BigDecimal total = rows.stream().map(Result::getFinalScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long passCount = rows.stream().filter(Result::isPassed).count();
        Map<String, Long> distribution = new LinkedHashMap<>();
        Arrays.stream(ScoreRange.values())
                .forEach(range -> {
                    distribution.put(range.name(), 0L);
                    distribution.put(ScoreRangeClassifier.labelOf(range), 0L);
                });
        for (Result result : rows) {
            ScoreRange range = ScoreRangeClassifier.classify(result.getFinalScore());
            distribution.merge(range.name(), 1L, Long::sum);
            distribution.merge(ScoreRangeClassifier.labelOf(range), 1L, Long::sum);
        }
        return new ResultResponse.Statistics.Row(key.periodId(), key.periodName(), key.departmentId(),
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

    /** Null means manager-scoped reporting; non-null is the authenticated council member's assignment scope. */
    private List<DefenseAssignment> getCouncilScope(User user) {
        if (access.hasRole(user, RoleName.ROLE_ADMIN) || access.hasRole(user, RoleName.ROLE_PRINCIPAL)) {
            return null;
        }
        if (!access.hasRole(user, RoleName.ROLE_COUNCIL)) {
            throw new AccessDeniedException(
                    "Only administrators, department heads, or council members can view academic results");
        }
        return assignments.findByCouncilMemberLecturerId(user.getId()).stream()
                .filter(a -> a.getCouncil().getStatus() != CouncilStatus.CANCELLED)
                .toList();
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

    private ResultResponse.Defense toResponse(
            Result result, com.nexus.portal.model.PublishedResultDetails details) {
        DefenseAssignment assignment = result.getAssignment();
        Topic topic = assignment.getRegistration().getTopic();
        User student = result.getStudent();
        String advisorName = details != null ? details.getAdvisorName()
                : (topic != null && topic.getTopicLecturers() != null
                ? topic.getTopicLecturers().stream()
                        .filter(tl -> tl.getAdvisorRole() == AdvisorRole.PRIMARY && tl.getLecturer() != null && tl.getLecturer().getFullName() != null)
                        .map(tl -> tl.getLecturer().getFullName())
                        .findFirst().orElse("")
                : "");
        BigDecimal advisorScore = details != null
                ? average(details.getAdvisorContentScore(), details.getAdvisorImplementationScore(), details.getAdvisorPresentationScore())
                : ScoreCalculationServiceImpl.calculateInferredAdvisorScore(result.getFinalScore(), result.getReviewScore(), result.getDefenseScore());

        return new ResultResponse.Defense(assignment.getId(), assignment.getRegistration().getId(),
                topic.getPeriod().getId(), topic.getPeriod().getName(), topic.getDepartment().getId(),
                topic.getDepartment().getName(), topic.getId(), topic.getTitle(),
                assignment.getRegistration().getTeam().getName(), student.getId(), student.getFullName(),
                student.getStudentCode(),
                advisorScore,
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
                advisorName,
                details == null ? null : details.getAdvisorComment(),
                details == null ? null : details.getReviewComment(),
                details == null ? null : details.getDefenseComments(),
                result.getFinalScore(), result.isPassed(), true, result.getPublishedAt());
    }

    private record ReportKey(Long periodId, String periodName, Long departmentId, String departmentName,
                             Long topicId, String topicTitle) {}
}
