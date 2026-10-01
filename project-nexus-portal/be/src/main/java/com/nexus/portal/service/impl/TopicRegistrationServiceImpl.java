package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.TopicRegistrationRequest;
import com.nexus.portal.dto.request.TopicReviewRequest;
import com.nexus.portal.dto.response.TopicRegistrationResponse;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.TopicRegistrationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class TopicRegistrationServiceImpl implements TopicRegistrationService {

    private final TopicRegistrationRepository topicRegistrationRepository;
    private final TopicRepository topicRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    public TopicRegistrationServiceImpl(TopicRegistrationRepository topicRegistrationRepository,
                                        TopicRepository topicRepository,
                                        TeamRepository teamRepository,
                                        TeamMemberRepository teamMemberRepository,
                                        UserRepository userRepository) {
        this.topicRegistrationRepository = topicRegistrationRepository;
        this.topicRepository = topicRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public TopicRegistrationResponse registerTopic(TopicRegistrationRequest request, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + currentUserEmail)));

        boolean isStudent = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_USER);
        if (!isStudent) {
            throw new AccessDeniedException("Only students are permitted to register for topics.");
        }

        TeamMember leaderMember = teamMemberRepository.findByUserIdAndRoleInTeam(currentUser.getId(), TeamRole.LEADER)
                .orElseThrow(() -> new IllegalArgumentException("Only team leaders can register for a topic"));

        Team team = leaderMember.getTeam();
        if (team.getStatus() == TeamStatus.LOCKED) {
            throw new IllegalArgumentException("Team is already locked into an approved topic");
        }

        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + request.getTopicId()));

        if (topic.getStatus() != TopicStatus.OPEN) {
            throw new IllegalArgumentException("Topic is not open for registration (status is not OPEN)");
        }

        RegistrationPeriod period = topic.getPeriod();
        if (period == null || period.getStatus() != PeriodStatus.OPEN) {
            throw new IllegalArgumentException("Registration period is not open");
        }

        LocalDateTime now = LocalDateTime.now();
        if (period.getStartDate() != null && now.isBefore(period.getStartDate())) {
            throw new IllegalArgumentException("Registration period has not started yet");
        }
        if (period.getEndDate() != null && now.isAfter(period.getEndDate())) {
            throw new IllegalArgumentException("Registration period has ended");
        }

        // Check if team already has an approved registration
        if (topicRegistrationRepository.existsByTeamIdAndStatus(team.getId(), RegistrationStatus.APPROVED)) {
            throw new IllegalArgumentException("Team already has an approved topic registration");
        }

        // Check if team already submitted for this topic
        topicRegistrationRepository.findByTopicIdAndTeamId(topic.getId(), team.getId())
                .ifPresent(existing -> {
                    if (existing.getStatus() == RegistrationStatus.PENDING || existing.getStatus() == RegistrationStatus.APPROVED) {
                        throw new IllegalArgumentException("Team already has a pending or approved registration for this topic");
                    }
                });

        TopicRegistration registration = TopicRegistration.builder()
                .topic(topic)
                .team(team)
                .message(request.getMessage())
                .status(RegistrationStatus.PENDING)
                .registeredAt(LocalDateTime.now())
                .build();

        TopicRegistration saved = topicRegistrationRepository.save(registration);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TopicRegistrationResponse reviewRegistration(Long registrationId, TopicReviewRequest request, String reviewerEmail) {
        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseGet(() -> userRepository.findByUsername(reviewerEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + reviewerEmail)));

        TopicRegistration registration = topicRegistrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id: " + registrationId));

        Topic topic = registration.getTopic();
        boolean isAdvisor = topic.getTopicLecturers().stream()
                .anyMatch(tl -> tl.getLecturer().getId().equals(reviewer.getId()));
        boolean isAdmin = reviewer.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
        boolean isPrincipal = reviewer.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_PRINCIPAL);

        if (isPrincipal) {
            boolean inDepartment = reviewer.getDepartments().stream()
                    .anyMatch(d -> d.getId().equals(topic.getDepartment().getId()));
            if (!inDepartment) {
                throw new AccessDeniedException("Department heads can only approve topics within their own department.");
            }
        } else if (!isAdmin && !isAdvisor) {
            throw new AccessDeniedException("Only the topic advisor, managing department head, or administrator can approve registrations.");
        }

        if (request.getStatus() != RegistrationStatus.APPROVED && request.getStatus() != RegistrationStatus.REJECTED) {
            throw new IllegalArgumentException("Review decision status must be APPROVED or REJECTED");
        }

        registration.setStatus(request.getStatus());
        registration.setFeedback(request.getFeedback());
        registration.setReviewedAt(LocalDateTime.now());
        registration.setReviewedBy(reviewer);

        if (request.getStatus() == RegistrationStatus.APPROVED) {
            // Lock the team
            Team team = registration.getTeam();
            team.setStatus(TeamStatus.LOCKED);
            teamRepository.save(team);

            // Reject/cancel other pending registrations of this team
            List<TopicRegistration> otherTeamRegistrations = topicRegistrationRepository.findByTeamId(team.getId());
            for (TopicRegistration other : otherTeamRegistrations) {
                if (!Objects.equals(other.getId(), registration.getId()) && other.getStatus() == RegistrationStatus.PENDING) {
                    other.setStatus(RegistrationStatus.REJECTED);
                    other.setFeedback("Auto-rejected: Team has been approved for another topic.");
                    other.setReviewedAt(LocalDateTime.now());
                    topicRegistrationRepository.save(other);
                }
            }
        }

        TopicRegistration updated = topicRegistrationRepository.save(registration);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicRegistrationResponse> getTeamRegistrations(Long teamId, String currentUserEmail) {
        return topicRegistrationRepository.findByTeamId(teamId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicRegistrationResponse> getTopicRegistrations(Long topicId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + currentUserEmail)));

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + topicId));

        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
        boolean isPrincipal = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_PRINCIPAL);
        boolean isAdvisor = topic.getTopicLecturers().stream()
                .anyMatch(tl -> tl.getLecturer().getId().equals(currentUser.getId()));

        if (isAdmin) {
            // Admin can view all
        } else if (isPrincipal) {
            boolean inDepartment = currentUser.getDepartments().stream()
                    .anyMatch(d -> d.getId().equals(topic.getDepartment().getId()));
            if (!inDepartment) {
                throw new AccessDeniedException("Department heads can only view topics and applicant lists within their own department.");
            }
        } else if (!isAdvisor) {
            throw new AccessDeniedException("You do not have permission to view applicants for this topic.");
        }

        return topicRegistrationRepository.findByTopicId(topicId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopicRegistrationResponse> getMyTeamRegistrations(String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + currentUserEmail)));

        return teamMemberRepository.findByUserId(user.getId()).stream()
                .map(TeamMember::getTeam)
                .flatMap(team -> topicRegistrationRepository.findByTeamId(team.getId()).stream())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelRegistration(Long registrationId, String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + currentUserEmail)));

        TopicRegistration registration = topicRegistrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id: " + registrationId));

        TeamMember leader = teamMemberRepository.findByTeamIdAndRoleInTeam(registration.getTeam().getId(), TeamRole.LEADER)
                .orElseThrow(() -> new IllegalArgumentException("No team leader found"));

        if (!leader.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Only team leader can cancel registration");
        }

        if (registration.getStatus() != RegistrationStatus.PENDING) {
            throw new IllegalArgumentException("Only pending registrations can be cancelled");
        }

        topicRegistrationRepository.delete(registration);
    }

    private TopicRegistrationResponse mapToResponse(TopicRegistration reg) {
        List<com.nexus.portal.dto.response.TeamMemberResponse> members = teamMemberRepository.findByTeamId(reg.getTeam().getId()).stream()
                .map(tm -> new com.nexus.portal.dto.response.TeamMemberResponse(
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

        TopicRegistrationResponse resp = new TopicRegistrationResponse(
                reg.getId(),
                reg.getTopic().getId(),
                reg.getTopic().getTitle(),
                reg.getTeam().getId(),
                reg.getTeam().getName(),
                reg.getMessage(),
                reg.getStatus(),
                reg.getFeedback(),
                reg.getRegisteredAt(),
                reg.getReviewedAt(),
                reg.getReviewedBy() != null ? reg.getReviewedBy().getId() : null,
                reg.getReviewedBy() != null ? reg.getReviewedBy().getFullName() : null
        );
        resp.setMembers(members);
        return resp;
    }
}
