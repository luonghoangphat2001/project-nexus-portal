package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.*;
import com.nexus.portal.enums.AssessmentStatus;
import com.nexus.portal.enums.AssessmentType;
import com.nexus.portal.enums.CouncilStatus;
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
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class FinalResultServiceImpl implements FinalResultService {
    private final AssessmentRepository assessments;
    private final DefenseAssignmentRepository assignments;
    private final DefenseCouncilRepository councils;
    private final TeamMemberRepository members;
    private final FinalResultRepository results;
    private final DepartmentRepository departments;
    private final RegistrationPeriodRepository periods;
    private final TopicRepository topics;
    private final DefenseAccessPolicy access;
    private final AuditLogService audit;
    private final Clock clock;

    public FinalResultServiceImpl(AssessmentRepository assessments, DefenseAssignmentRepository assignments,
                                  DefenseCouncilRepository councils, TeamMemberRepository members,
                                  FinalResultRepository results, DepartmentRepository departments,
                                  RegistrationPeriodRepository periods, TopicRepository topics,
                                  DefenseAccessPolicy access, AuditLogService audit, Clock clock) {
        this.assessments = assessments;
        this.assignments = assignments;
        this.councils = councils;
        this.members = members;
        this.results = results;
        this.departments = departments;
        this.periods = periods;
        this.topics = topics;
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
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phân công bảo vệ"));
        DefenseCouncil council = councils.findLockedById(councilId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội đồng"));
        DefenseAssignment assignment = getAssignment(assignmentId);
        Department department = assignment.getRegistration().getTopic().getDepartment();
        requireManager(manager, department);
        if (council.getStatus() != CouncilStatus.COMPLETED) {
            throw new BadRequestException("Chỉ có thể công bố kết quả sau khi hội đồng đã hoàn tất");
        }
        if (results.existsByAssignmentId(assignmentId)) {
            throw new BadRequestException("Kết quả của phân công này đã được công bố");
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
                "Đã công bố " + saved.size() + " kết quả cho đăng ký "
                        + assignment.getRegistration().getId(), null, null, "SUCCESS");
        return saved.stream().map(this::toResponse).toList();
    }

    @Override
    public List<FinalGradeResponse> getMyPublishedGrades(String identifier) {
        User student = access.getUser(identifier);
        if (!access.hasRole(student, com.nexus.portal.enums.RoleName.ROLE_USER)) {
            throw new AccessDeniedException("Chỉ sinh viên mới được xem kết quả cá nhân");
        }
        return results.findByStudentIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(student.getId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    public AcademicReportOptionsResponse getReportOptions(String identifier) {
        User manager = access.getUser(identifier);
        List<Department> scope = getManagedDepartments(manager);
        List<Long> departmentIds = scope.stream().map(Department::getId).toList();
        List<AcademicReportOptionsResponse.Option> departmentOptions = scope.stream()
                .sorted(Comparator.comparing(Department::getName))
                .map(d -> new AcademicReportOptionsResponse.Option(d.getId(), d.getName())).toList();
        List<AcademicReportOptionsResponse.Option> periodOptions = periods.findAll().stream()
                .sorted(Comparator.comparing(RegistrationPeriod::getStartDate).reversed())
                .map(p -> new AcademicReportOptionsResponse.Option(p.getId(), p.getName())).toList();
        List<AcademicReportOptionsResponse.TopicOption> topicOptions = departmentIds.isEmpty() ? List.of()
                : topics.findByDepartmentIdIn(departmentIds).stream()
                .sorted(Comparator.comparing(Topic::getTitle))
                .map(t -> new AcademicReportOptionsResponse.TopicOption(t.getId(), t.getTitle(),
                        t.getDepartment().getId(), t.getPeriod().getId())).toList();
        return new AcademicReportOptionsResponse(periodOptions, departmentOptions, topicOptions);
    }

    @Override
    public List<AcademicReportRowResponse> getAcademicReport(
            Long periodId, Long departmentId, Long topicId, String identifier) {
        User manager = access.getUser(identifier);
        Set<Long> allowedDepartmentIds = getManagedDepartments(manager).stream()
                .map(Department::getId).collect(Collectors.toSet());
        if (departmentId != null && !allowedDepartmentIds.contains(departmentId)) {
            throw new AccessDeniedException("Bạn không có quyền xem kết quả học tập của khoa này");
        }
        if (periodId != null && !periods.existsById(periodId)) {
            throw new ResourceNotFoundException("Không tìm thấy đợt đăng ký");
        }
        if (topicId != null) {
            Topic topic = topics.findById(topicId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề tài"));
            if (!allowedDepartmentIds.contains(topic.getDepartment().getId())) {
                throw new AccessDeniedException("Bạn không có quyền xem kết quả học tập của đề tài này");
            }
        }

        Map<ReportKey, List<FinalResult>> grouped = new HashMap<>();
        results.findAll().stream()
                .filter(result -> result.getPublishedAt() != null)
                .filter(result -> allowedDepartmentIds.contains(
                        result.getAssignment().getRegistration().getTopic().getDepartment().getId()))
                .filter(result -> periodId == null || result.getAssignment().getRegistration().getTopic()
                        .getPeriod().getId().equals(periodId))
                .filter(result -> departmentId == null || result.getAssignment().getRegistration().getTopic()
                        .getDepartment().getId().equals(departmentId))
                .filter(result -> topicId == null || result.getAssignment().getRegistration().getTopic()
                        .getId().equals(topicId))
                .forEach(result -> {
                    Topic topic = result.getAssignment().getRegistration().getTopic();
                    RegistrationPeriod period = topic.getPeriod();
                    Department department = topic.getDepartment();
                    ReportKey key = new ReportKey(period.getId(), period.getName(), department.getId(),
                            department.getName(), topic.getId(), topic.getTitle());
                    grouped.computeIfAbsent(key, ignored -> new ArrayList<>()).add(result);
                });

        return grouped.entrySet().stream().map(entry -> toReportRow(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(AcademicReportRowResponse::periodName)
                        .thenComparing(AcademicReportRowResponse::departmentName)
                        .thenComparing(AcademicReportRowResponse::topicTitle))
                .toList();
    }

    private List<CalculatedGrade> calculate(DefenseAssignment assignment) {
        if (assignment.getCouncil().getStatus() != CouncilStatus.COMPLETED) {
            throw new BadRequestException("Chỉ có thể xem kết quả sau khi hội đồng đã hoàn tất");
        }
        List<Assessment> submitted = assessments.findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(assignment.getId())
                .stream().filter(a -> a.getStatus() == AssessmentStatus.SUBMITTED).toList();
        int expectedDefenseAssessments = assignment.getCouncil().getMembers().size();
        if (expectedDefenseAssessments == 0) {
            throw new BadRequestException("Hội đồng chưa được phân công thành viên");
        }

        List<TeamMember> students = members.findByTeamId(assignment.getRegistration().getTeam().getId());
        if (students.isEmpty()) throw new BadRequestException("Nhóm được phân công chưa có sinh viên");
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
                throw new BadRequestException("Phiếu đánh giá đã gửi chưa đầy đủ cho sinh viên " + student.getId());
            }
            BigDecimal reviewScore = FinalGradeCalculator.average(reviews);
            BigDecimal defenseScore = FinalGradeCalculator.average(defenses);
            BigDecimal finalScore = FinalGradeCalculator.finalScore(reviewScore, defenseScore);
            grades.add(new CalculatedGrade(student, reviewScore, defenseScore,
                    finalScore, FinalGradeCalculator.passed(finalScore)));
        }
        return grades;
    }

    private AcademicReportRowResponse toReportRow(ReportKey key, Collection<FinalResult> rows) {
        BigDecimal total = rows.stream().map(FinalResult::getFinalScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long passCount = rows.stream().filter(FinalResult::isPassed).count();
        Map<String, Long> distribution = new LinkedHashMap<>();
        AcademicReportRowResponse.SCORE_BANDS.forEach(band -> distribution.put(band, 0L));
        for (FinalResult result : rows) {
            String band = scoreBand(result.getFinalScore());
            distribution.compute(band, (ignored, count) -> count + 1);
        }
        return new AcademicReportRowResponse(key.periodId(), key.periodName(), key.departmentId(),
                key.departmentName(), key.topicId(), key.topicTitle(), rows.size(),
                total.divide(BigDecimal.valueOf(rows.size()), 2, RoundingMode.HALF_UP),
                passCount, rows.size() - passCount, distribution);
    }

    private String scoreBand(BigDecimal score) {
        if (score.compareTo(new BigDecimal("5.00")) < 0) return AcademicReportRowResponse.SCORE_BANDS.get(0);
        if (score.compareTo(new BigDecimal("6.00")) < 0) return AcademicReportRowResponse.SCORE_BANDS.get(1);
        if (score.compareTo(new BigDecimal("7.00")) < 0) return AcademicReportRowResponse.SCORE_BANDS.get(2);
        if (score.compareTo(new BigDecimal("8.00")) < 0) return AcademicReportRowResponse.SCORE_BANDS.get(3);
        if (score.compareTo(new BigDecimal("9.00")) < 0) return AcademicReportRowResponse.SCORE_BANDS.get(4);
        return AcademicReportRowResponse.SCORE_BANDS.get(5);
    }

    private List<Department> getManagedDepartments(User manager) {
        if (!access.hasRole(manager, com.nexus.portal.enums.RoleName.ROLE_ADMIN)
                && !access.hasRole(manager, com.nexus.portal.enums.RoleName.ROLE_PRINCIPAL)) {
            throw new AccessDeniedException("Chỉ quản trị viên và trưởng khoa được phân công mới có quyền xem kết quả học tập");
        }
        List<Department> scope = departments.findAll().stream()
                .filter(department -> access.canManage(manager, department)).toList();
        if (scope.isEmpty()) throw new AccessDeniedException("Bạn không được phân quyền quản lý khoa nào");
        return scope;
    }

    private void requireManager(User user, Department department) {
        if (!access.canManage(user, department)) {
            throw new AccessDeniedException("Bạn không có quyền quản lý kết quả của khoa này");
        }
    }

    private DefenseAssignment getAssignment(Long assignmentId) {
        return assignments.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phân công bảo vệ"));
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

    private record ReportKey(Long periodId, String periodName, Long departmentId, String departmentName,
                             Long topicId, String topicTitle) {}
}
