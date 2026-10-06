package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.DefenseRegistrationResponse;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.*;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Objects;

/** Object-level permissions shared by modules 11–13; never trust client role flags. */
@Component
public class DefenseAccessPolicy {
    private final UserRepository users;
    private final TopicRegistrationRepository registrations;
    private final TeamMemberRepository members;
    private final DefenseAssignmentRepository assignments;
    private final AssessmentRepository assessments;
    private final Clock clock;

    public DefenseAccessPolicy(UserRepository users, TopicRegistrationRepository registrations,
                               TeamMemberRepository members, DefenseAssignmentRepository assignments,
                               AssessmentRepository assessments, Clock clock) {
        this.users = users;
        this.registrations = registrations;
        this.members = members;
        this.assignments = assignments;
        this.assessments = assessments;
        this.clock = clock;
    }

    public User getUser(String identifier) {
        User user = users.findByUsernameOrEmail(identifier, identifier)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
        if (!user.isActive()) throw new AccessDeniedException("The user account has been deactivated");
        return user;
    }

    public boolean hasRole(User user, RoleName role) {
        return user.getRoles().stream().anyMatch(r -> r.getName() == role);
    }

    public boolean canManage(User user, Department department) {
        return hasRole(user, RoleName.ROLE_ADMIN) || (hasRole(user, RoleName.ROLE_PRINCIPAL)
                && user.getDepartments().stream().anyMatch(d -> Objects.equals(d.getId(), department.getId())));
    }

    public void requireManager(User user, Department department) {
        if (!canManage(user, department)) throw new AccessDeniedException("Only administrators or the responsible department head can manage council assignments");
    }

    public boolean isAdvisor(User user, TopicRegistration registration) {
        return registration.getTopic().getTopicLecturers().stream()
                .anyMatch(l -> Objects.equals(l.getLecturer().getId(), user.getId()));
    }

    public boolean isTeamMember(User user, TopicRegistration registration) {
        return members.existsByTeamIdAndUserId(registration.getTeam().getId(), user.getId());
    }

    public boolean isCouncilMember(User user, DefenseCouncil council) {
        return council.getMembers().stream().anyMatch(m -> Objects.equals(m.getLecturer().getId(), user.getId()));
    }

    public boolean canRead(User user, TopicRegistration registration) {
        return canManage(user, registration.getTopic().getDepartment()) || isTeamMember(user, registration)
                || isAdvisor(user, registration) || assignments.findByRegistrationId(registration.getId())
                .filter(a -> a.getCouncil().getStatus() != CouncilStatus.CANCELLED)
                .map(a -> isCouncilMember(user, a.getCouncil())).orElse(false);
    }

    public TopicRegistration getRegistration(Long id, boolean lock) {
        TopicRegistration registration = (lock ? registrations.findLockedById(id) : registrations.findById(id))
                .orElseThrow(() -> new ResourceNotFoundException("Project registration not found"));
        if (registration.getStatus() != RegistrationStatus.APPROVED) {
            throw new BadRequestException("The project registration has not been approved");
        }
        return registration;
    }

    public void requireRead(User user, TopicRegistration registration) {
        if (!canRead(user, registration)) throw new AccessDeniedException("You do not have access to this team's documents");
    }

    public boolean canSubmit(User user, TopicRegistration registration) {
        LocalDateTime deadline = registration.getTopic().getPeriod().getSubmissionDeadline();
        return hasRole(user, RoleName.ROLE_USER) && isTeamMember(user, registration)
                && Objects.equals(registration.getTeam().getLeader().getId(), user.getId())
                && deadline != null && !LocalDateTime.now(clock).isAfter(deadline)
                && !assessments.existsByAssignmentRegistrationIdAndStatus(registration.getId(), AssessmentStatus.SUBMITTED)
                && assignments.findByRegistrationId(registration.getId())
                .map(a -> a.getCouncil().getStatus() != CouncilStatus.COMPLETED).orElse(true);
    }

    public DefenseRegistrationResponse toResponse(TopicRegistration r, User user) {
        Topic topic = r.getTopic();
        return new DefenseRegistrationResponse(r.getId(), topic.getId(), topic.getTitle(),
                r.getTeam().getId(), r.getTeam().getName(), topic.getDepartment().getId(),
                topic.getDepartment().getName(), topic.getPeriod().getId(), topic.getPeriod().getName(),
                topic.getPeriod().getSubmissionDeadline(), canSubmit(user, r), canManage(user, topic.getDepartment()),
                members.findByTeamId(r.getTeam().getId()).stream().map(m -> new DefenseRegistrationResponse.Student(
                        m.getUser().getId(), m.getUser().getFullName(), m.getUser().getStudentCode())).toList());
    }
}
