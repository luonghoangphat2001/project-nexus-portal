package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.TeamCreateRequest;
import com.nexus.portal.dto.request.TeamInvitationRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.TeamService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamInvitationRepository teamInvitationRepository;
    private final TeamJoinRequestRepository teamJoinRequestRepository;
    private final UserRepository userRepository;
    private final RegistrationPeriodRepository registrationPeriodRepository;

    public TeamServiceImpl(TeamRepository teamRepository,
                           TeamMemberRepository teamMemberRepository,
                           TeamInvitationRepository teamInvitationRepository,
                           TeamJoinRequestRepository teamJoinRequestRepository,
                           UserRepository userRepository,
                           RegistrationPeriodRepository registrationPeriodRepository) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamInvitationRepository = teamInvitationRepository;
        this.teamJoinRequestRepository = teamJoinRequestRepository;
        this.userRepository = userRepository;
        this.registrationPeriodRepository = registrationPeriodRepository;
    }

    @Override
    @Transactional
    public TeamResponse createTeam(TeamCreateRequest request, Long leaderId) {
        User leader = userRepository.findById(leaderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", leaderId));

        boolean isStudent = leader.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_USER);
        if (!isStudent) {
            throw new AccessDeniedException("Only students are permitted to create and lead a team.");
        }

        RegistrationPeriod period = registrationPeriodRepository.findById(request.getPeriodId())
                .orElseThrow(() -> new ResourceNotFoundException("RegistrationPeriod", "id", request.getPeriodId()));

        // Check if leader already belongs to a team in this period
        Optional<Team> existingTeam = teamRepository.findByUserIdAndPeriodId(leaderId, period.getId());
        if (existingTeam.isPresent()) {
            throw new BadRequestException("You already belong to team '" + existingTeam.get().getName() + "' in this registration period");
        }

        // Validate student has cohort, major, and faculty
        if (leader.getCohort() == null || leader.getMajor() == null) {
            throw new BadRequestException("Student profile must have cohort and major assigned before creating a team");
        }

        Faculty faculty = leader.getMajor().getDepartment().getFaculty();

        Team team = Team.builder()
                .name(request.getName())
                .leader(leader)
                .period(period)
                .faculty(faculty)
                .cohort(leader.getCohort())
                .major(leader.getMajor())
                .status(TeamStatus.FORMING)
                .build();

        Team savedTeam = teamRepository.save(team);

        // Add leader as first member
        TeamMember leaderMember = TeamMember.builder()
                .team(savedTeam)
                .user(leader)
                .roleInTeam(TeamRole.LEADER)
                .joinedAt(LocalDateTime.now())
                .build();
        teamMemberRepository.save(leaderMember);
        savedTeam.getMembers().add(leaderMember);

        // Auto-cancel any previous pending invitations/requests since leader now has a team
        teamInvitationRepository.cancelAllPendingInvitationsForInvitee(leaderId);
        teamJoinRequestRepository.cancelAllPendingRequestsForApplicant(leaderId);

        return mapToResponse(savedTeam);
    }

    @Override
    @Transactional(readOnly = true)
    public TeamResponse getMyTeam(Long userId, Long periodId) {
        Team team;
        if (periodId != null) {
            team = teamRepository.findByUserIdAndPeriodId(userId, periodId)
                    .orElseThrow(() -> new ResourceNotFoundException("Team", "userId in period", userId));
        } else {
            List<Team> teams = teamRepository.findAllTeamsByUserId(userId);
            if (teams.isEmpty()) {
                throw new ResourceNotFoundException("Team", "userId", userId);
            }
            team = teams.get(0);
        }
        return mapToResponse(team);
    }

    @Override
    @Transactional(readOnly = true)
    public TeamResponse getTeamById(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
        return mapToResponse(team);
    }

    @Override
    @Transactional
    public TeamResponse updateTeamName(Long teamId, String name, Long leaderId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        if (!team.getLeader().getId().equals(leaderId)) {
            throw new BadRequestException("Only the team leader can rename the team");
        }

        team.setName(name);
        return mapToResponse(teamRepository.save(team));
    }

    @Override
    @Transactional
    public TeamInvitationResponse sendInvitation(Long teamId, TeamInvitationRequest request, Long inviterId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        if (!team.getLeader().getId().equals(inviterId)) {
            throw new BadRequestException("Only the team leader can send invitations");
        }

        if (team.getStatus() == TeamStatus.LOCKED) {
            throw new BadRequestException("Team is locked and cannot add new members");
        }

        long currentCount = teamMemberRepository.countByTeamId(teamId);
        if (currentCount >= 3) {
            throw new BadRequestException("Team has already reached the maximum limit of 3 students");
        }

        User invitee = userRepository.findById(request.getInviteeId())
                .orElseThrow(() -> new ResourceNotFoundException("Invitee User", "id", request.getInviteeId()));

        boolean isInviteeStudent = invitee.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_USER);
        if (!isInviteeStudent) {
            throw new BadRequestException("Only students are permitted to join a team. The invited user is not a student.");
        }

        // Check if invitee already belongs to a team in this period
        Optional<Team> inviteeExistingTeam = teamRepository.findByUserIdAndPeriodId(invitee.getId(), team.getPeriod().getId());
        if (inviteeExistingTeam.isPresent()) {
            throw new BadRequestException("Student already belongs to an active team in this period");
        }

        // Check for existing pending invitation from THIS team
        Optional<TeamInvitation> existingInvite = teamInvitationRepository.findByTeamIdAndInviteeIdAndStatus(
                teamId, invitee.getId(), InvitationStatus.PENDING);
        if (existingInvite.isPresent()) {
            throw new BadRequestException("Your team has already sent a pending invitation to this student");
        }

        User inviter = userRepository.findById(inviterId)
                .orElseThrow(() -> new ResourceNotFoundException("Inviter User", "id", inviterId));

        TeamInvitation invitation = TeamInvitation.builder()
                .team(team)
                .inviter(inviter)
                .invitee(invitee)
                .message(request.getMessage())
                .type(InvitationType.INVITE_BY_LEADER)
                .status(InvitationStatus.PENDING)
                .build();

        TeamInvitation saved = teamInvitationRepository.save(invitation);
        return mapToInvitationResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamInvitationResponse> getMyInvitations(Long userId) {
        List<TeamInvitation> invitations = teamInvitationRepository.findByInviteeId(userId);
        return invitations.stream().map(this::mapToInvitationResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TeamResponse respondToInvitation(Long invitationId, boolean accept, Long userId) {
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamInvitation", "id", invitationId));

        if (!invitation.getInvitee().getId().equals(userId)) {
            throw new BadRequestException("You can only respond to your own invitations");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BadRequestException("This invitation is no longer pending");
        }

        Team team = invitation.getTeam();

        if (!accept) {
            invitation.setStatus(InvitationStatus.REJECTED);
            teamInvitationRepository.save(invitation);
            return mapToResponse(team);
        }

        // Check team capacity
        long currentCount = teamMemberRepository.countByTeamId(team.getId());
        if (currentCount >= 3) {
            invitation.setStatus(InvitationStatus.CANCELLED);
            teamInvitationRepository.save(invitation);
            throw new BadRequestException("This team is already full (maximum 3 members)");
        }

        // Check if student already joined another team in this period
        Optional<Team> existing = teamRepository.findByUserIdAndPeriodId(userId, team.getPeriod().getId());
        if (existing.isPresent()) {
            invitation.setStatus(InvitationStatus.CANCELLED);
            teamInvitationRepository.save(invitation);
            throw new BadRequestException("You already belong to a team in this registration period");
        }

        // Accept invitation
        invitation.setStatus(InvitationStatus.ACCEPTED);
        teamInvitationRepository.save(invitation);

        // Add user as MEMBER
        User user = invitation.getInvitee();
        boolean isStudent = user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ROLE_USER);
        if (!isStudent) {
            throw new AccessDeniedException("Only students are permitted to join a team.");
        }

        TeamMember member = TeamMember.builder()
                .team(team)
                .user(user)
                .roleInTeam(TeamRole.MEMBER)
                .joinedAt(LocalDateTime.now())
                .build();
        teamMemberRepository.save(member);
        team.getMembers().add(member);

        // Check if team now has 3 members -> update status to READY
        if (currentCount + 1 >= 3) {
            team.setStatus(TeamStatus.READY);
            teamRepository.save(team);
        }

        // AUTO-CANCEL ALL OTHER PENDING INVITATIONS AND JOIN REQUESTS FOR THIS STUDENT
        teamInvitationRepository.cancelAllPendingInvitationsForInvitee(userId);
        teamJoinRequestRepository.cancelAllPendingRequestsForApplicant(userId);

        return mapToResponse(team);
    }

    @Override
    @Transactional
    public TeamResponse removeMember(Long teamId, Long memberUserId, Long leaderId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        if (!team.getLeader().getId().equals(leaderId)) {
            throw new BadRequestException("Only the team leader can remove members");
        }

        if (team.getStatus() == TeamStatus.LOCKED) {
            throw new BadRequestException("Team is locked and cannot remove members");
        }

        if (memberUserId.equals(leaderId)) {
            throw new BadRequestException("Team leader cannot remove themselves. Transfer leadership or delete the team.");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamMember", "userId", memberUserId));

        teamMemberRepository.delete(member);
        team.getMembers().remove(member);
        team.setStatus(TeamStatus.FORMING);

        return mapToResponse(teamRepository.save(team));
    }

    @Override
    @Transactional
    public void leaveTeam(Long teamId, Long userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        if (team.getStatus() == TeamStatus.LOCKED) {
            throw new BadRequestException("Team is locked and cannot be left");
        }

        if (team.getLeader().getId().equals(userId)) {
            throw new BadRequestException("Leader cannot leave the team. Transfer leadership first.");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamMember", "userId", userId));

        teamMemberRepository.delete(member);
        team.getMembers().remove(member);
        team.setStatus(TeamStatus.FORMING);
        teamRepository.save(team);
    }

    @Override
    @Transactional
    public TeamResponse transferLeader(Long teamId, Long newLeaderUserId, Long currentLeaderId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        if (!team.getLeader().getId().equals(currentLeaderId)) {
            throw new BadRequestException("Only current team leader can transfer leadership");
        }

        TeamMember newLeaderMember = teamMemberRepository.findByTeamIdAndUserId(teamId, newLeaderUserId)
                .orElseThrow(() -> new BadRequestException("New leader must be an existing team member"));

        TeamMember currentLeaderMember = teamMemberRepository.findByTeamIdAndUserId(teamId, currentLeaderId)
                .orElseThrow(() -> new BadRequestException("Current leader record not found"));

        currentLeaderMember.setRoleInTeam(TeamRole.MEMBER);
        newLeaderMember.setRoleInTeam(TeamRole.LEADER);
        teamMemberRepository.save(currentLeaderMember);
        teamMemberRepository.save(newLeaderMember);

        team.setLeader(newLeaderMember.getUser());
        return mapToResponse(teamRepository.save(team));
    }

    private TeamResponse mapToResponse(Team team) {
        List<TeamMember> members = teamMemberRepository.findByTeamId(team.getId());
        List<TeamMemberResponse> memberResponses = members.stream()
                .map(m -> new TeamMemberResponse(
                        m.getId(),
                        m.getUser().getId(),
                        m.getUser().getUsername(),
                        m.getUser().getFullName(),
                        m.getUser().getStudentCode(),
                        m.getUser().getAvatarUrl(),
                        m.getUser().getEmail(),
                        m.getUser().getPhone(),
                        m.getRoleInTeam(),
                        m.getJoinedAt()
                ))
                .collect(Collectors.toList());

        Faculty f = team.getFaculty();
        FacultyResponse facultyResp = f != null ? new FacultyResponse(f.getId(), f.getCode(), f.getName()) : null;

        Cohort c = team.getCohort();
        CohortResponse cohortResp = c != null ? new CohortResponse(c.getId(), c.getCode(), c.getName(), c.getAdmissionYear(), c.getGraduationYear()) : null;

        Major m = team.getMajor();
        MajorResponse majorResp = m != null ? new MajorResponse(m.getId(), m.getDepartment().getId(), m.getCode(), m.getName()) : null;

        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .leaderId(team.getLeader().getId())
                .leaderName(team.getLeader().getFullName())
                .periodId(team.getPeriod().getId())
                .periodName(team.getPeriod().getName())
                .faculty(facultyResp)
                .cohort(cohortResp)
                .major(majorResp)
                .status(team.getStatus())
                .members(memberResponses)
                .createdAt(team.getCreatedAt())
                .build();
    }

    private TeamInvitationResponse mapToInvitationResponse(TeamInvitation inv) {
        return new TeamInvitationResponse(
                inv.getId(),
                inv.getTeam().getId(),
                inv.getTeam().getName(),
                inv.getInviter().getId(),
                inv.getInviter().getFullName(),
                inv.getInvitee().getId(),
                inv.getInvitee().getFullName(),
                inv.getMessage(),
                inv.getType(),
                inv.getStatus(),
                inv.getCreatedAt()
        );
    }
}
