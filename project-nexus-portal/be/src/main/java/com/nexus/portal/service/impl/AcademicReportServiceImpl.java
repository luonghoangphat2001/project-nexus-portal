package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.AcademicReportOptionsResponse;
import com.nexus.portal.dto.response.AcademicReportRowResponse;
import com.nexus.portal.enums.AcademicScoreBand;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.AcademicReportRepository;
import com.nexus.portal.repository.DepartmentRepository;
import com.nexus.portal.repository.RegistrationPeriodRepository;
import com.nexus.portal.repository.TopicRepository;
import com.nexus.portal.service.AcademicReportService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AcademicReportServiceImpl implements AcademicReportService {
    private final AcademicReportRepository reports;
    private final DepartmentRepository departments;
    private final RegistrationPeriodRepository periods;
    private final TopicRepository topics;
    private final DefenseAccessPolicy access;

    public AcademicReportServiceImpl(AcademicReportRepository reports, DepartmentRepository departments,
                                     RegistrationPeriodRepository periods, TopicRepository topics,
                                     DefenseAccessPolicy access) {
        this.reports = reports;
        this.departments = departments;
        this.periods = periods;
        this.topics = topics;
        this.access = access;
    }

    @Override
    public AcademicReportOptionsResponse getReportOptions(String identifier) {
        User manager = access.getUser(identifier);
        List<Department> scope = getManagedDepartments(manager);
        List<Long> departmentIds = scope.stream().map(Department::getId).toList();
        List<AcademicReportOptionsResponse.Option> departmentOptions = scope.stream()
                .sorted(Comparator.comparing(Department::getName))
                .map(department -> new AcademicReportOptionsResponse.Option(
                        department.getId(), department.getName()))
                .toList();
        List<AcademicReportOptionsResponse.Option> periodOptions = periods.findAll().stream()
                .sorted(Comparator.comparing(RegistrationPeriod::getStartDate).reversed())
                .map(period -> new AcademicReportOptionsResponse.Option(period.getId(), period.getName()))
                .toList();
        List<AcademicReportOptionsResponse.TopicOption> topicOptions = departmentIds.isEmpty() ? List.of()
                : topics.findByDepartmentIdIn(departmentIds).stream()
                .sorted(Comparator.comparing(Topic::getTitle))
                .map(topic -> new AcademicReportOptionsResponse.TopicOption(topic.getId(), topic.getTitle(),
                        topic.getDepartment().getId(), topic.getPeriod().getId()))
                .toList();
        return new AcademicReportOptionsResponse(periodOptions, departmentOptions, topicOptions);
    }

    @Override
    public List<AcademicReportRowResponse> getAcademicReport(
            Long periodId, Long departmentId, Long topicId, String identifier) {
        User manager = access.getUser(identifier);
        Set<Long> allowedDepartmentIds = getManagedDepartments(manager).stream()
                .map(Department::getId)
                .collect(Collectors.toSet());
        if (departmentId != null && !allowedDepartmentIds.contains(departmentId)) {
            throw new AccessDeniedException("You are not authorized to view academic results for this department");
        }
        if (periodId != null && !periods.existsById(periodId)) {
            throw new ResourceNotFoundException("Registration period not found");
        }
        if (topicId != null) {
            Topic topic = topics.findById(topicId)
                    .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
            if (!allowedDepartmentIds.contains(topic.getDepartment().getId())) {
                throw new AccessDeniedException("You are not authorized to view academic results for this topic");
            }
        }

        Map<ReportKey, List<FinalResult>> grouped = new HashMap<>();
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
                .sorted(Comparator.comparing(AcademicReportRowResponse::periodName)
                        .thenComparing(AcademicReportRowResponse::departmentName)
                        .thenComparing(AcademicReportRowResponse::topicTitle))
                .toList();
    }

    private AcademicReportRowResponse toReportRow(ReportKey key, List<FinalResult> rows) {
        BigDecimal total = rows.stream().map(FinalResult::getFinalScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long passCount = rows.stream().filter(FinalResult::isPassed).count();
        Map<String, Long> distribution = new LinkedHashMap<>();
        Arrays.stream(AcademicScoreBand.values())
                .forEach(band -> distribution.put(band.getLabel(), 0L));
        for (FinalResult result : rows) {
            String band = AcademicScoreBand.forScore(result.getFinalScore()).getLabel();
            distribution.merge(band, 1L, Long::sum);
        }
        return new AcademicReportRowResponse(key.periodId(), key.periodName(), key.departmentId(),
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
            throw new AccessDeniedException("You are not assigned to manage any departments");
        }
        return scope;
    }

    private record ReportKey(Long periodId, String periodName, Long departmentId, String departmentName,
                             Long topicId, String topicTitle) {}
}
