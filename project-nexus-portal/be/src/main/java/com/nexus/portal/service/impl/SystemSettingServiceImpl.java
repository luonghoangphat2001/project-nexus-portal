package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.SystemSettingUpdateRequest;
import com.nexus.portal.dto.response.SystemMetricsResponse;
import com.nexus.portal.dto.response.SystemSettingResponse;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.SystemSetting;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.AuditLogService;
import com.nexus.portal.service.SystemSettingService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.util.*;

@Service
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final MajorRepository majorRepository;
    private final CohortRepository cohortRepository;
    private final TopicRepository topicRepository;
    private final TeamRepository teamRepository;
    private final MatchmakingPostRepository matchmakingPostRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;

    public SystemSettingServiceImpl(SystemSettingRepository systemSettingRepository,
                                    UserRepository userRepository,
                                    RoleRepository roleRepository,
                                    FacultyRepository facultyRepository,
                                    DepartmentRepository departmentRepository,
                                    MajorRepository majorRepository,
                                    CohortRepository cohortRepository,
                                    TopicRepository topicRepository,
                                    TeamRepository teamRepository,
                                    MatchmakingPostRepository matchmakingPostRepository,
                                    AuditLogRepository auditLogRepository,
                                    AuditLogService auditLogService) {
        this.systemSettingRepository = systemSettingRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.majorRepository = majorRepository;
        this.cohortRepository = cohortRepository;
        this.topicRepository = topicRepository;
        this.teamRepository = teamRepository;
        this.matchmakingPostRepository = matchmakingPostRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditLogService = auditLogService;
    }

    @PostConstruct
    @Transactional
    public void initDefaults() {
        initSettingIfAbsent("SYSTEM_NAME", "Nexus Portal - HCMUTE", "Portal title displayed across application", "GENERAL");
        initSettingIfAbsent("CURRENT_SEMESTER", "Fall Semester (2026 - 2027)", "Active academic semester for capstone projects", "ACADEMIC");
        initSettingIfAbsent("MIN_TEAM_MEMBERS", "1", "Minimum number of students required per team", "ACADEMIC");
        initSettingIfAbsent("MAX_TEAM_MEMBERS", "3", "Maximum number of students allowed per team", "ACADEMIC");
        initSettingIfAbsent("ALLOW_STUDENT_MATCHMAKING", "true", "Allow students to publish teammate matchmaking requests", "FEATURE");
        initSettingIfAbsent("MAINTENANCE_MODE", "false", "Enable global system maintenance mode", "SECURITY");
        initSettingIfAbsent("AUTO_APPROVE_TOPIC_REGISTRATION", "false", "Automatically approve topic registrations when criteria are met", "WORKFLOW");
    }

    private void initSettingIfAbsent(String key, String value, String description, String category) {
        if (!systemSettingRepository.existsBySettingKey(key)) {
            SystemSetting setting = new SystemSetting(null, key, value, description, category);
            systemSettingRepository.save(setting);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getAllSettings() {
        return systemSettingRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SystemSettingResponse getSettingByKey(String key) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("System setting not found with key: " + key));
        return mapToResponse(setting);
    }

    @Override
    @Transactional
    public SystemSettingResponse updateSetting(String key, SystemSettingUpdateRequest request, String updatedBy) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("System setting not found with key: " + key));

        String oldValue = setting.getSettingValue();
        setting.setSettingValue(request.getSettingValue());
        if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
            setting.setDescription(request.getDescription().trim());
        }

        SystemSetting saved = systemSettingRepository.save(setting);

        auditLogService.log(
                null,
                updatedBy != null ? updatedBy : "SYSTEM",
                "UPDATE_SYSTEM_SETTING",
                "SystemSetting",
                "Updated setting [" + key + "]: '" + oldValue + "' -> '" + request.getSettingValue() + "'",
                "127.0.0.1",
                "NexusPortal/Admin",
                "SUCCESS"
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SystemMetricsResponse getSystemMetrics() {
        SystemMetricsResponse metrics = new SystemMetricsResponse();

        // JVM Metrics
        Runtime runtime = Runtime.getRuntime();
        metrics.setTotalMemoryBytes(runtime.totalMemory());
        metrics.setFreeMemoryBytes(runtime.freeMemory());
        metrics.setUsedMemoryBytes(runtime.totalMemory() - runtime.freeMemory());
        metrics.setMaxMemoryBytes(runtime.maxMemory());
        metrics.setAvailableProcessors(runtime.availableProcessors());
        metrics.setJvmVersion(System.getProperty("java.version"));
        metrics.setUptimeSeconds(ManagementFactory.getRuntimeMXBean().getUptime() / 1000);

        // Database Metrics
        metrics.setDatabaseConnected(true);
        metrics.setTotalUsers(userRepository.count());
        metrics.setActiveUsers(userRepository.countByActiveTrue());
        metrics.setTotalRoles(roleRepository.count());
        metrics.setTotalFaculties(facultyRepository.count());
        metrics.setTotalDepartments(departmentRepository.count());
        metrics.setTotalMajors(majorRepository.count());
        metrics.setTotalCohorts(cohortRepository.count());
        metrics.setTotalTopics(topicRepository.count());
        metrics.setTotalTeams(teamRepository.count());
        metrics.setTotalMatchmakingPosts(matchmakingPostRepository.count());
        metrics.setTotalAuditLogs(auditLogRepository.count());

        // Users by role
        Map<String, Long> roleMap = new HashMap<>();
        roleRepository.findAll().forEach(r -> {
            roleMap.put(r.getName().name(), userRepository.countByRolesContaining(r));
        });
        metrics.setUsersByRole(roleMap);

        return metrics;
    }

    private SystemSettingResponse mapToResponse(SystemSetting s) {
        return new SystemSettingResponse(
                s.getId(),
                s.getSettingKey(),
                s.getSettingValue(),
                s.getDescription(),
                s.getCategory(),
                s.getUpdatedAt()
        );
    }
}
