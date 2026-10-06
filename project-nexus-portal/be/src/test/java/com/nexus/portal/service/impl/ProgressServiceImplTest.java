package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.*;
import com.nexus.portal.enums.ProgressStatus;
import com.nexus.portal.exception.*;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProgressServiceImplTest {
    private final TeamRepository teams = mock(TeamRepository.class);
    private final TeamMemberRepository members = mock(TeamMemberRepository.class);
    private final ProgressTaskRepository tasks = mock(ProgressTaskRepository.class);
    private final ProgressServiceImpl service = new ProgressServiceImpl(teams, members, mock(TopicRegistrationRepository.class),
            mock(TopicLecturerRepository.class), tasks, mock(UserRepository.class));
    private UserPrincipal student(long id) {
        return new UserPrincipal(id, "student", "student@example.com", "", "Student", true, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }
    private Team team() {
        User leader = new User(); leader.setId(1L);
        Team team = new Team(); team.setId(5L); team.setLeader(leader);
        RegistrationPeriod period = new RegistrationPeriod(); period.setSubmissionDeadline(LocalDateTime.of(2027, 1, 1, 17, 0)); team.setPeriod(period);
        return team;
    }
    @Test void deniesUnrelatedStudentAccess() {
        when(teams.findById(5L)).thenReturn(Optional.of(team()));
        assertThrows(AppException.class, () -> service.getTasks(5L, student(2L)));
        verifyNoInteractions(tasks);
    }
    @Test void deniesAssigningTaskToNonmember() {
        when(teams.findById(5L)).thenReturn(Optional.of(team()));
        assertThrows(BadRequestException.class, () -> service.save(5L, null,
                new ProgressTaskRequest("Research", "", LocalDate.of(2026, 11, 1), 3L), student(1L)));
        verify(tasks, never()).save(any());
    }
    @Test void deniesStudentAdvisorFeedback() {
        ProgressTask task = new ProgressTask(); task.setTeam(team());
        when(tasks.findById(7L)).thenReturn(Optional.of(task));
        assertThrows(AppException.class, () -> service.review(7L, new ProgressFeedbackRequest("Looks good"), student(1L)));
    }
    @Test void assigneeCanUpdateTheirOwnTask() {
        ProgressTask task = new ProgressTask(); task.setTeam(team()); task.setTitle("Research"); task.setDueDate(LocalDate.of(2026, 11, 1));
        User assignee = new User(); assignee.setId(2L); task.setAssignee(assignee);
        when(tasks.findById(7L)).thenReturn(Optional.of(task));
        when(members.existsByTeamIdAndUserId(5L, 2L)).thenReturn(true);
        when(tasks.save(task)).thenReturn(task);
        assertEquals(ProgressStatus.DONE, service.updateStatus(7L, new ProgressStatusRequest(ProgressStatus.DONE), student(2L)).status());
    }
    @Test void otherMemberCannotUpdateTaskStatus() {
        ProgressTask task = new ProgressTask(); task.setTeam(team());
        User assignee = new User(); assignee.setId(2L); task.setAssignee(assignee);
        when(tasks.findById(7L)).thenReturn(Optional.of(task)); when(members.existsByTeamIdAndUserId(5L, 3L)).thenReturn(true);
        assertThrows(AppException.class, () -> service.updateStatus(7L, new ProgressStatusRequest(ProgressStatus.DONE), student(3L)));
    }
}
