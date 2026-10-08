package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.*;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.*;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.security.UserPrincipal;
import com.nexus.portal.service.ProgressService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional
public class ProgressServiceImpl implements ProgressService {
    private final TeamRepository teams;
    private final TeamMemberRepository members;
    private final TopicRegistrationRepository registrations;
    private final TopicLecturerRepository advisors;
    private final ProgressTaskRepository tasks;
    private final UserRepository users;

    public ProgressServiceImpl(TeamRepository teams, TeamMemberRepository members, TopicRegistrationRepository registrations,
            TopicLecturerRepository advisors, ProgressTaskRepository tasks, UserRepository users) {
        this.teams = teams;
        this.members = members;
        this.registrations = registrations;
        this.advisors = advisors;
        this.tasks = tasks;
        this.users = users;
    }
    @Transactional(readOnly = true)
    public List<ProgressTeamResponse> getTeams(UserPrincipal actor) {
        return teams.findAll().stream().filter(team -> canAccess(team, actor)).map(team ->
                new ProgressTeamResponse(team.getId(), team.getName(), team.getPeriod().getName(), canManage(team, actor),
                        isStaff(actor) || isAdvisor(team, actor), members.findByTeamId(team.getId()).stream().map(member ->
                        new ProgressTeamResponse.Member(member.getUser().getId(), member.getUser().getFullName())).toList())).toList();
    }
    @Transactional(readOnly = true)
    public List<ProgressTaskResponse> getTasks(Long teamId, UserPrincipal actor) {
        require(canAccess(findTeam(teamId), actor));
        return tasks.findByTeamIdOrderByDueDateAsc(teamId).stream().map(this::response).toList();
    }
    public ProgressTaskResponse save(Long teamId, Long id, ProgressTaskRequest request, UserPrincipal actor) {
        Team team = findTeam(teamId);
        require(canManage(team, actor));
        if (!members.existsByTeamIdAndUserId(teamId, request.assigneeId())) {
            throw new BadRequestException("Assignee must be a member of this team");
        }
        if (request.dueDate().isAfter(team.getPeriod().getSubmissionDeadline().toLocalDate())) {
            throw new BadRequestException("Task due date must not exceed the submission deadline");
        }
        ProgressTask task = id == null ? new ProgressTask() : findTask(id);
        if (id != null && !task.getTeam().getId().equals(teamId)) throw new BadRequestException("Task belongs to another team");
        task.setTeam(team);
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setDueDate(request.dueDate());
        task.setAssignee(users.findById(request.assigneeId()).orElseThrow(() -> new ResourceNotFoundException("Assignee not found")));
        return response(tasks.save(task));
    }
    public ProgressTaskResponse updateStatus(Long id, ProgressStatusRequest request, UserPrincipal actor) {
        ProgressTask task = findTask(id);
        require(canManage(task.getTeam(), actor) || (members.existsByTeamIdAndUserId(task.getTeam().getId(), actor.getId())
                && task.getAssignee().getId().equals(actor.getId())));
        task.setStatus(request.status());
        return response(tasks.save(task));
    }
    public ProgressTaskResponse review(Long id, ProgressFeedbackRequest request, UserPrincipal actor) {
        ProgressTask task = findTask(id);
        require(isStaff(actor) || isAdvisor(task.getTeam(), actor));
        task.setFeedback(request.feedback().trim());
        return response(tasks.save(task));
    }
    public void delete(Long id, UserPrincipal actor) {
        ProgressTask task = findTask(id);
        require(canManage(task.getTeam(), actor));
        tasks.delete(task);
    }
    private boolean canAccess(Team team, UserPrincipal actor) {
        return isStaff(actor) || team.getLeader().getId().equals(actor.getId())
                || members.existsByTeamIdAndUserId(team.getId(), actor.getId()) || isAdvisor(team, actor);
    }
    private boolean canManage(Team team, UserPrincipal actor) {
        return isStaff(actor) || team.getLeader().getId().equals(actor.getId()) || isAdvisor(team, actor);
    }
    private boolean isStaff(UserPrincipal actor) {
        return actor.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")
                || authority.getAuthority().equals("ROLE_PRINCIPAL"));
    }
    private boolean isAdvisor(Team team, UserPrincipal actor) {
        return actor.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_TEACHER"))
                && registrations.findByTeamId(team.getId()).stream().filter(registration -> registration.getStatus() == RegistrationStatus.APPROVED)
                .anyMatch(registration -> advisors.findByTopicId(registration.getTopic().getId()).stream()
                        .anyMatch(advisor -> advisor.getLecturer().getId().equals(actor.getId())));
    }
    private void require(boolean allowed) {
        if (!allowed) throw new AppException("You do not have permission to access this team's progress", HttpStatus.FORBIDDEN);
    }
    private Team findTeam(Long id) { return teams.findById(id).orElseThrow(() -> new ResourceNotFoundException("Team not found")); }
    private ProgressTask findTask(Long id) { return tasks.findById(id).orElseThrow(() -> new ResourceNotFoundException("Progress task not found")); }
    private ProgressTaskResponse response(ProgressTask task) {
        return new ProgressTaskResponse(task.getId(), task.getTeam().getId(), task.getTitle(), task.getDescription(), task.getDueDate(),
                task.getAssignee().getId(), task.getAssignee().getFullName(), task.getStatus(), task.getFeedback(),
                task.getStatus() != ProgressStatus.DONE && task.getDueDate().isBefore(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))));
    }
}
