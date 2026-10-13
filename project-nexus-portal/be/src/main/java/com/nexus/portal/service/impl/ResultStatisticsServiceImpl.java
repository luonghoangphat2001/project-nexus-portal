package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.ResultStatisticsOptionsResponse;
import com.nexus.portal.dto.response.ResultStatisticsRowResponse;
import com.nexus.portal.enums.ScoreRange;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.ResultStatisticsRepository;
import com.nexus.portal.repository.DepartmentRepository;
import com.nexus.portal.repository.RegistrationPeriodRepository;
import com.nexus.portal.repository.TopicRepository;
import com.nexus.portal.service.ResultStatisticsService;
import com.nexus.portal.service.ScoreRangeClassifier;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ResultStatisticsServiceImpl implements ResultStatisticsService {
    private final ResultStatisticsRepository reports;
    private final DepartmentRepository departments;
    private final RegistrationPeriodRepository periods;
    private final TopicRepository topics;
    private final DefenseAccessPolicy access;

    public ResultStatisticsServiceImpl(ResultStatisticsRepository reports, DepartmentRepository departments,
                                     RegistrationPeriodRepository periods, TopicRepository topics,
                                     DefenseAccessPolicy access) {
        this.reports = reports;
        this.departments = departments;
        this.periods = periods;
        this.topics = topics;
        this.access = access;
    }

    @Override
    public ResultStatisticsOptionsResponse getFilterOptions(String identifier) {
        User manager = access.getUser(identifier);
        List<Department> scope = getManagedDepartments(manager);
        List<Long> departmentIds = scope.stream().map(Department::getId).toList();
        List<ResultStatisticsOptionsResponse.Option> departmentOptions = scope.stream()
                .sorted(Comparator.comparing(Department::getName))
                .map(department -> new ResultStatisticsOptionsResponse.Option(
                        department.getId(), department.getName()))
                .toList();
        List<ResultStatisticsOptionsResponse.Option> periodOptions = periods.findAll().stream()
                .sorted(Comparator.comparing(RegistrationPeriod::getStartDate).reversed())
                .map(period -> new ResultStatisticsOptionsResponse.Option(period.getId(), period.getName()))
                .toList();
        List<ResultStatisticsOptionsResponse.TopicOption> topicOptions = departmentIds.isEmpty() ? List.of()
                : topics.findByDepartmentIdIn(departmentIds).stream()
                .sorted(Comparator.comparing(Topic::getTitle))
                .map(topic -> new ResultStatisticsOptionsResponse.TopicOption(topic.getId(), topic.getTitle(),
                        topic.getDepartment().getId(), topic.getPeriod().getId()))
                .toList();
        return new ResultStatisticsOptionsResponse(periodOptions, departmentOptions, topicOptions);
    }

    @Override
    public List<ResultStatisticsRowResponse> getStatistics(
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
                .sorted(Comparator.comparing(ResultStatisticsRowResponse::periodName)
                        .thenComparing(ResultStatisticsRowResponse::departmentName)
                        .thenComparing(ResultStatisticsRowResponse::topicTitle))
                .toList();
    }

    private ResultStatisticsRowResponse toReportRow(ReportKey key, List<PublishedResult> rows) {
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
        return new ResultStatisticsRowResponse(key.periodId(), key.periodName(), key.departmentId(),
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

    private record ReportKey(Long periodId, String periodName, Long departmentId, String departmentName,
                             Long topicId, String topicTitle) {}
}
