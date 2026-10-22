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
import java.util.List;
import java.util.Objects;

/** Object-level permissions shared by modules 11–13; never trust client role flags. */
@Component
public class DefenseAccessPolicy {
    private final UserRepository users;
    private final TopicRegistrationRepository registrations;
    private final TeamMemberRepository members;
    private final DefenseAssignmentRepository assignments;
    private final AssessmentRepository assessments;
    private final TopicLecturerRepository advisors;
    private final Clock clock;

    public DefenseAccessPolicy(UserRepository users, TopicRegistrationRepository registrations,
                               TeamMemberRepository members, DefenseAssignmentRepository assignments,
                               AssessmentRepository assessments, TopicLecturerRepository advisors, Clock clock) {
        this.users = users;
        this.registrations = registrations;
        this.members = members;
        this.assignments = assignments;
        this.assessments = assessments;
        this.advisors = advisors;
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
        if (hasRole(user, RoleName.ROLE_ADMIN)) {
            return true;
        }
        if (hasRole(user, RoleName.ROLE_PRINCIPAL)) {
            boolean matchesDept = user.getDepartments().stream()
                    .anyMatch(d -> Objects.equals(d.getId(), department.getId()));
            boolean matchesFaculty = department.getFaculty() != null && user.getFaculties().stream()
                    .anyMatch(f -> Objects.equals(f.getId(), department.getFaculty().getId()));
            return matchesDept || matchesFaculty;
        }
        return false;
    }

    public void requireManager(User user, Department department) {
        if (!canManage(user, department)) throw new AccessDeniedException("Only administrators or the responsible department head can manage council assignments");
    }

    public boolean isAdvisor(User user, TopicRegistration registration) {
        return registration.getTopic().getTopicLecturers().stream()
                .anyMatch(l -> Objects.equals(l.getLecturer().getId(), user.getId()));
    }

    public boolean isPrimaryAdvisor(User user, TopicRegistration registration) {
        return registration.getTopic().getTopicLecturers().stream()
                .anyMatch(l -> l.getAdvisorRole() == AdvisorRole.PRIMARY
                        && Objects.equals(l.getLecturer().getId(), user.getId()));
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
        List<DefenseRegistrationResponse.Advisor> advisorList = advisors.findByTopicId(topic.getId()).stream()
                .map(tl -> new DefenseRegistrationResponse.Advisor(
                        tl.getLecturer().getId(),
                        tl.getLecturer().getFullName(),
                        tl.getLecturer().getEmail(),
                        tl.getAdvisorRole() != null ? tl.getAdvisorRole().name() : null))
                .toList();
        return new DefenseRegistrationResponse(r.getId(), topic.getId(), topic.getTitle(),
                r.getTeam().getId(), r.getTeam().getName(), topic.getDepartment().getId(),
                topic.getDepartment().getName(), topic.getPeriod().getId(), topic.getPeriod().getName(),
                topic.getPeriod().getSubmissionDeadline(), canSubmit(user, r), canManage(user, topic.getDepartment()),
                members.findByTeamId(r.getTeam().getId()).stream().map(m -> new DefenseRegistrationResponse.Student(
                        m.getUser().getId(), m.getUser().getFullName(), m.getUser().getStudentCode())).toList(),
                advisorList);
    }
}
