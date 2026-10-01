package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.TopicCreateRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.enums.AdvisorRole;
import com.nexus.portal.enums.RegistrationStatus;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.enums.TopicStatus;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.TopicService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TopicServiceImpl implements TopicService {

    private final TopicRepository topicRepository;
    private final TopicLecturerRepository topicLecturerRepository;
    private final DepartmentRepository departmentRepository;
    private final MajorRepository majorRepository;
    private final RegistrationPeriodRepository registrationPeriodRepository;
    private final UserRepository userRepository;
    private final TopicRegistrationRepository topicRegistrationRepository;
    private final TeamMemberRepository teamMemberRepository;

    public TopicServiceImpl(TopicRepository topicRepository,
                            TopicLecturerRepository topicLecturerRepository,
                            DepartmentRepository departmentRepository,
                            MajorRepository majorRepository,
                            RegistrationPeriodRepository registrationPeriodRepository,
                            UserRepository userRepository,
                            TopicRegistrationRepository topicRegistrationRepository,
                            TeamMemberRepository teamMemberRepository) {
        this.topicRepository = topicRepository;
        this.topicLecturerRepository = topicLecturerRepository;
        this.departmentRepository = departmentRepository;
        this.majorRepository = majorRepository;
        this.registrationPeriodRepository = registrationPeriodRepository;
        this.userRepository = userRepository;
        this.topicRegistrationRepository = topicRegistrationRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    @Override
    @Transactional
    public TopicResponse createTopic(TopicCreateRequest request, Long lecturerId) {
        User primaryLecturer = userRepository.findById(lecturerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", lecturerId));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));

        RegistrationPeriod period = registrationPeriodRepository.findById(request.getPeriodId())
                .orElseThrow(() -> new ResourceNotFoundException("RegistrationPeriod", "id", request.getPeriodId()));

        Set<Major> majors = new HashSet<>();
        if (request.getMajorIds() != null && !request.getMajorIds().isEmpty()) {
            majors.addAll(majorRepository.findAllById(request.getMajorIds()));
        }

        Topic topic = Topic.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .objectives(request.getObjectives())
                .requirements(request.getRequirements())
                .department(department)
                .period(period)
                .type(request.getType())
                .maxStudents(request.getMaxStudents())
                .duration(request.getDuration())
                .status(TopicStatus.OPEN)
                .isRegistrationOpen(true)
                .majors(majors)
                .build();

        Topic savedTopic = topicRepository.save(topic);

        // Add Primary Advisor
        TopicLecturer primaryAdvisor = new TopicLecturer(savedTopic, primaryLecturer, AdvisorRole.PRIMARY);
        topicLecturerRepository.save(primaryAdvisor);
        savedTopic.getTopicLecturers().add(primaryAdvisor);

        // Optional Co-Advisor (max 2 advisors rule)
        if (request.getCoAdvisorId() != null) {
            if (request.getCoAdvisorId().equals(lecturerId)) {
                throw new BadRequestException("Co-advisor cannot be the same as the primary advisor");
            }
            User coAdvisor = userRepository.findById(request.getCoAdvisorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Co-Advisor User", "id", request.getCoAdvisorId()));
            TopicLecturer secondaryAdvisor = new TopicLecturer(savedTopic, coAdvisor, AdvisorRole.CO_ADVISOR);
            topicLecturerRepository.save(secondaryAdvisor);
            savedTopic.getTopicLecturers().add(secondaryAdvisor);
        }

        return mapToResponse(savedTopic);
    }

    @Override
    @Transactional
    public TopicResponse updateTopic(Long topicId, TopicCreateRequest request, Long lecturerId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", "id", topicId));

        validateLecturerOwnership(topic, lecturerId);

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));

        RegistrationPeriod period = registrationPeriodRepository.findById(request.getPeriodId())
                .orElseThrow(() -> new ResourceNotFoundException("RegistrationPeriod", "id", request.getPeriodId()));

        Set<Major> majors = new HashSet<>();
        if (request.getMajorIds() != null && !request.getMajorIds().isEmpty()) {
            majors.addAll(majorRepository.findAllById(request.getMajorIds()));
        }

        topic.setTitle(request.getTitle());
        topic.setDescription(request.getDescription());
        topic.setObjectives(request.getObjectives());
        topic.setRequirements(request.getRequirements());
        topic.setDepartment(department);
        topic.setPeriod(period);
        topic.setType(request.getType());
        topic.setMaxStudents(request.getMaxStudents());
        topic.setDuration(request.getDuration());
        topic.setMajors(majors);

        // Manage Co-Advisor update
        List<TopicLecturer> existingAdvisors = topicLecturerRepository.findByTopicId(topicId);
        Optional<TopicLecturer> coAdvisorOpt = existingAdvisors.stream()
                .filter(a -> a.getAdvisorRole() == AdvisorRole.CO_ADVISOR)
                .findFirst();

        if (request.getCoAdvisorId() != null) {
            if (request.getCoAdvisorId().equals(lecturerId)) {
                throw new BadRequestException("Co-advisor cannot be the same as the primary advisor");
            }
            User coAdvisor = userRepository.findById(request.getCoAdvisorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Co-Advisor User", "id", request.getCoAdvisorId()));
            if (coAdvisorOpt.isPresent()) {
                TopicLecturer existingCoAdvisor = coAdvisorOpt.get();
                if (!existingCoAdvisor.getLecturer().getId().equals(request.getCoAdvisorId())) {
                    topicLecturerRepository.delete(existingCoAdvisor);
                    TopicLecturer newCoAdvisor = new TopicLecturer(topic, coAdvisor, AdvisorRole.CO_ADVISOR);
                    topicLecturerRepository.save(newCoAdvisor);
                }
            } else {
                TopicLecturer newCoAdvisor = new TopicLecturer(topic, coAdvisor, AdvisorRole.CO_ADVISOR);
                topicLecturerRepository.save(newCoAdvisor);
            }
        } else {
            coAdvisorOpt.ifPresent(topicLecturerRepository::delete);
        }

        Topic updatedTopic = topicRepository.save(topic);
        return mapToResponse(updatedTopic);
    }

    @Override
    @Transactional
    public void deleteTopic(Long topicId, Long lecturerId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", "id", topicId));

        validateLecturerOwnership(topic, lecturerId);

        boolean hasApprovedTeam = topicRegistrationRepository.existsByTopicIdAndStatus(topicId, com.nexus.portal.enums.RegistrationStatus.APPROVED);
        if (hasApprovedTeam) {
            throw new BadRequestException("Cannot delete topic with an approved registration");
        }

        topicRepository.delete(topic);
    }

    @Override
    @Transactional
    public TopicResponse toggleRegistration(Long topicId, Long lecturerId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", "id", topicId));

        validateLecturerOwnership(topic, lecturerId);

        topic.setIsRegistrationOpen(!Boolean.TRUE.equals(topic.getIsRegistrationOpen()));
        Topic saved = topicRepository.save(topic);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicResponse> getLecturerTopics(Long lecturerId) {
        List<Topic> topics = topicRepository.findByLecturerId(lecturerId);
        return topics.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicResponse> getTopicsByScope(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserEmail)));

        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
        boolean isPrincipal = currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_PRINCIPAL);

        if (isAdmin) {
            return topicRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
        }

        if (isPrincipal) {
            Set<Long> deptIds = currentUser.getDepartments().stream()
                    .map(Department::getId)
                    .collect(Collectors.toSet());
            if (deptIds.isEmpty()) {
                return Collections.emptyList();
            }
            return topicRepository.findByDepartmentIdIn(deptIds).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        // Default to teacher/advisor assigned topics
        return topicRepository.findByLecturerId(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicResponse> getTopicsByDepartment(Long departmentId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserEmail)));

        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
        boolean isPrincipal = currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_PRINCIPAL);

        if (isAdmin) {
            return topicRepository.findByDepartmentId(departmentId).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        if (isPrincipal) {
            boolean inDepartment = currentUser.getDepartments().stream()
                    .anyMatch(d -> d.getId().equals(departmentId));
            if (!inDepartment) {
                throw new AccessDeniedException(
                        "Department heads can only view topics within their own department (Department ID " + departmentId + " is outside managed scope)");
            }
            return topicRepository.findByDepartmentId(departmentId).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        throw new AccessDeniedException("You do not have permission to access topics by department");
    }

    @Override
    @Transactional(readOnly = true)
    public TopicResponse getTopicById(Long topicId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", "id", topicId));
        return mapToResponse(topic);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TopicResponse> searchTopics(String keyword, Long departmentId, Long majorId,
                                           Long lecturerId, TopicStatus status, Long periodId, Pageable pageable) {
        Page<Topic> page = topicRepository.searchTopics(keyword, departmentId, majorId, lecturerId, status, periodId, pageable);
        return page.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TopicCompareResponse compareTopics(List<Long> topicIds) {
        if (topicIds == null || topicIds.isEmpty()) {
            throw new BadRequestException("Please provide at least 2 topic IDs to compare");
        }
        List<Topic> topics = topicRepository.findAllById(topicIds);
        List<TopicResponse> responses = topics.stream().map(this::mapToResponse).collect(Collectors.toList());
        return new TopicCompareResponse(responses);
    }

    private void validateLecturerOwnership(Topic topic, Long lecturerId) {
        List<TopicLecturer> advisors = topicLecturerRepository.findByTopicId(topic.getId());
        boolean isAdvisor = advisors.stream().anyMatch(a -> a.getLecturer().getId().equals(lecturerId));
        if (!isAdvisor) {
            throw new BadRequestException("You do not have permission to manage this topic");
        }
    }

    private TopicResponse mapToResponse(Topic topic) {
        List<TopicLecturer> advisors = topicLecturerRepository.findByTopicId(topic.getId());
        List<TopicLecturerResponse> advisorResponses = advisors.stream()
                .map(a -> new TopicLecturerResponse(
                        a.getLecturer().getId(),
                        a.getLecturer().getFullName(),
                        a.getLecturer().getEmail(),
                        a.getLecturer().getAvatarUrl(),
                        a.getAdvisorRole()
                ))
                .collect(Collectors.toList());

        List<MajorResponse> majorResponses = topic.getMajors().stream()
                .map(m -> new MajorResponse(m.getId(), m.getDepartment().getId(), m.getCode(), m.getName()))
                .collect(Collectors.toList());

        Department dept = topic.getDepartment();
        DepartmentResponse deptResp = new DepartmentResponse(dept.getId(), dept.getFaculty().getId(), dept.getCode(), dept.getName());

        long registrationsCount = topicRegistrationRepository.findByTopicId(topic.getId()).size();

        // Check for approved registration to populate assignedTeam and all student members
        Optional<TopicRegistration> approvedReg = topicRegistrationRepository.findByTopicId(topic.getId()).stream()
                .filter(r -> r.getStatus() == RegistrationStatus.APPROVED)
                .findFirst();

        TeamResponse assignedTeamResp = null;
        if (approvedReg.isPresent()) {
            Team team = approvedReg.get().getTeam();
            List<TeamMemberResponse> members = teamMemberRepository.findByTeamId(team.getId()).stream()
                    .map(tm -> new TeamMemberResponse(
                            tm.getId(),
                            tm.getUser().getId(),
                            tm.getUser().getUsername(),
                            tm.getUser().getFullName(),
                            tm.getUser().getStudentCode(),
                            tm.getUser().getAvatarUrl(),
                            tm.getUser().getEmail(),
                            tm.getUser().getPhone(),
                            tm.getRoleInTeam(),
                            tm.getJoinedAt()
                    ))
                    .collect(Collectors.toList());

            assignedTeamResp = TeamResponse.builder()
                    .id(team.getId())
                    .name(team.getName())
                    .leaderId(team.getLeader() != null ? team.getLeader().getId() : null)
                    .leaderName(team.getLeader() != null ? team.getLeader().getFullName() : null)
                    .periodId(team.getPeriod() != null ? team.getPeriod().getId() : null)
                    .periodName(team.getPeriod() != null ? team.getPeriod().getName() : null)
                    .status(team.getStatus())
                    .members(members)
                    .createdAt(team.getCreatedAt())
                    .build();
        }

        return TopicResponse.builder()
                .id(topic.getId())
                .title(topic.getTitle())
                .description(topic.getDescription())
                .objectives(topic.getObjectives())
                .requirements(topic.getRequirements())
                .department(deptResp)
                .periodId(topic.getPeriod().getId())
                .periodName(topic.getPeriod().getName())
                .type(topic.getType())
                .maxStudents(topic.getMaxStudents())
                .duration(topic.getDuration())
                .status(topic.getStatus())
                .isRegistrationOpen(topic.getIsRegistrationOpen())
                .advisors(advisorResponses)
                .majors(majorResponses)
                .registeredTeamsCount(registrationsCount)
                .assignedTeam(assignedTeamResp)
                .createdAt(topic.getCreatedAt())
                .updatedAt(topic.getUpdatedAt())
                .build();
    }
}
