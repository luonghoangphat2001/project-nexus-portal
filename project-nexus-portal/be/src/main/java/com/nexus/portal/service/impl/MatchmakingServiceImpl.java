package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.MatchmakingPostCreateRequest;
import com.nexus.portal.dto.request.TeamJoinRequestCreateRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.MatchmakingService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.nexus.portal.service.NotificationService;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchmakingServiceImpl implements MatchmakingService {

    private final MatchmakingPostRepository postRepository;
    private final TeamJoinRequestRepository joinRequestRepository;
    private final TeamInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final DepartmentRepository departmentRepository;
    private final NotificationService notificationService;

    public MatchmakingServiceImpl(MatchmakingPostRepository postRepository,
                                  TeamJoinRequestRepository joinRequestRepository,
                                  TeamInvitationRepository invitationRepository,
                                  UserRepository userRepository,
                                  TeamRepository teamRepository,
                                  TeamMemberRepository teamMemberRepository,
                                  DepartmentRepository departmentRepository,
                                  NotificationService notificationService) {
        this.postRepository = postRepository;
        this.joinRequestRepository = joinRequestRepository;
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.departmentRepository = departmentRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public MatchmakingDashboardResponse getDashboard(String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + currentUserEmail)));

        Faculty userFaculty = user.getFaculties().isEmpty() ? null : user.getFaculties().iterator().next();
        Cohort userCohort = user.getCohort();

        Long facultyId = userFaculty != null ? userFaculty.getId() : null;
        Long cohortId = userCohort != null ? userCohort.getId() : null;

        List<MatchmakingPostResponse> posts = getPosts(null, facultyId, cohortId, null, null);
        List<TeamJoinRequestResponse> pendingRequests = joinRequestRepository.findPendingRequestsForAuthor(user.getId()).stream()
                .map(this::mapToJoinResponse)
                .collect(Collectors.toList());

        long activeCount = posts.size();
        long openSlots = posts.stream().mapToLong(p -> p.getSlotsNeeded() != null ? p.getSlotsNeeded() : 0).sum();

        return new MatchmakingDashboardResponse(posts, pendingRequests, activeCount, openSlots);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchmakingPostResponse> getPosts(PostType type, Long facultyId, Long cohortId, Long departmentId, String query) {
        Pageable pageable = PageRequest.of(0, 100);
        Page<MatchmakingPost> page = postRepository.searchPosts(
                type, facultyId, cohortId, departmentId, PostStatus.OPEN, query, pageable
        );
        return page.getContent().stream()
                .map(this::mapToPostResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MatchmakingPostResponse getPostById(Long id) {
        MatchmakingPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Matchmaking post not found with id: " + id));
        return mapToPostResponse(post);
    }

    @Override
    @Transactional
    public MatchmakingPostResponse createPost(MatchmakingPostCreateRequest request, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + currentUserEmail)));

        Team team = null;
        if (request.getPostType() == PostType.TEAM_LOOKING_FOR_MEMBER) {
            if (request.getTeamId() == null) {
                throw new IllegalArgumentException("Team ID is required when creating a team post");
            }
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + request.getTeamId()));

            TeamMember leader = teamMemberRepository.findByTeamIdAndRoleInTeam(team.getId(), TeamRole.LEADER)
                    .orElseThrow(() -> new IllegalArgumentException("Team leader not found"));
            if (!leader.getUser().getId().equals(currentUser.getId())) {
                throw new IllegalArgumentException("Only team leader can publish a post on behalf of the team");
            }
            if (team.getStatus() == TeamStatus.LOCKED) {
                throw new IllegalArgumentException("Cannot create post for locked team");
            }
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElse(null);
        }

        Faculty faculty = (team != null && team.getFaculty() != null) ? team.getFaculty()
                : (currentUser.getFaculties().isEmpty() ? null : currentUser.getFaculties().iterator().next());
        Cohort cohort = (team != null && team.getCohort() != null) ? team.getCohort() : currentUser.getCohort();

        MatchmakingPost post = MatchmakingPost.builder()
                .postType(request.getPostType())
                .author(currentUser)
                .team(team)
                .faculty(faculty)
                .cohort(cohort)
                .department(department)
                .title(request.getTitle())
                .goals(request.getGoals())
                .slotsNeeded(request.getSlotsNeeded() != null ? request.getSlotsNeeded() : 1)
                .contactInfo(request.getContactInfo())
                .status(PostStatus.OPEN)
                .skills(request.getSkills() != null ? request.getSkills() : new HashSet<>())
                .build();

        MatchmakingPost saved = postRepository.save(post);
        return mapToPostResponse(saved);
    }

    @Override
    @Transactional
    public void closePost(Long id, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + currentUserEmail)));

        MatchmakingPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        boolean isAuthor = post.getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);

        if (!isAuthor && !isAdmin) {
            throw new IllegalArgumentException("Only the post author or an admin can close this post");
        }

        post.setStatus(PostStatus.CLOSED);
        postRepository.save(post);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidateResponse> getCandidates(Long facultyId, Long cohortId, Long majorId, String query, String currentUserEmail) {
        User currentUser = null;
        if (currentUserEmail != null) {
            currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElseGet(() -> userRepository.findByUsername(currentUserEmail).orElse(null));
        }

        Long myTeamId = null;
        if (currentUser != null) {
            Optional<TeamMember> leaderMember = teamMemberRepository.findByUserIdAndRoleInTeam(currentUser.getId(), TeamRole.LEADER);
            if (leaderMember.isPresent()) {
                myTeamId = leaderMember.get().getTeam().getId();
            }
        }

        List<MatchmakingPost> studentPosts = postRepository.findCandidates(facultyId, cohortId);
        List<CandidateResponse> candidates = new ArrayList<>();

        for (MatchmakingPost post : studentPosts) {
            User student = post.getAuthor();
            if (student == null) continue;

            if (majorId != null && (student.getMajor() == null || !student.getMajor().getId().equals(majorId))) {
                continue;
            }

            if (query != null && !query.trim().isEmpty()) {
                String q = query.toLowerCase();
                boolean matchName = student.getFullName() != null && student.getFullName().toLowerCase().contains(q);
                boolean matchCode = student.getStudentCode() != null && student.getStudentCode().toLowerCase().contains(q);
                boolean matchSkill = post.getSkills().stream().anyMatch(s -> s.toLowerCase().contains(q));
                if (!matchName && !matchCode && !matchSkill) {
                    continue;
                }
            }

            boolean invitedByMyTeam = false;
            if (myTeamId != null) {
                invitedByMyTeam = invitationRepository.findByTeamIdAndInviteeIdAndStatus(
                        myTeamId, student.getId(), InvitationStatus.PENDING
                ).isPresent();
            }

            String facultyName = (student.getFaculties() != null && !student.getFaculties().isEmpty())
                    ? student.getFaculties().iterator().next().getName() : null;
            String cohortName = student.getCohort() != null ? student.getCohort().getName() : null;
            String majorName = student.getMajor() != null ? student.getMajor().getName() : null;

            candidates.add(new CandidateResponse(
                    student.getId(),
                    student.getStudentCode(),
                    student.getFullName(),
                    student.getEmail(),
                    student.getPhone(),
                    student.getAvatarUrl(),
                    facultyName,
                    cohortName,
                    majorName,
                    post.getId(),
                    post.getTitle(),
                    post.getGoals(),
                    post.getSkills(),
                    invitedByMyTeam
            ));
        }

        return candidates;
    }

    @Override
    @Transactional
    public TeamJoinRequestResponse submitJoinRequest(Long postId, TeamJoinRequestCreateRequest request, String currentUserEmail) {
        User applicant = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + currentUserEmail)));

        MatchmakingPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (post.getStatus() != PostStatus.OPEN) {
            throw new IllegalArgumentException("Matchmaking post is no longer open");
        }
        if (post.getTeam() == null) {
            throw new IllegalArgumentException("Join requests can only be sent to team posts");
        }
        if (post.getTeam().getStatus() == TeamStatus.LOCKED) {
            throw new IllegalArgumentException("Target team is already locked");
        }

        // Student cannot apply to their own team
        if (teamMemberRepository.existsByTeamIdAndUserId(post.getTeam().getId(), applicant.getId())) {
            throw new IllegalArgumentException("You are already a member of this team");
        }

        // Check if student already submitted a pending request to this post
        joinRequestRepository.findByPostIdAndApplicantIdAndStatus(post.getId(), applicant.getId(), RequestStatus.PENDING)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("You already have a pending join request for this post");
                });

        Faculty faculty = applicant.getFaculties().isEmpty() ? null : applicant.getFaculties().iterator().next();

        TeamJoinRequest joinRequest = TeamJoinRequest.builder()
                .post(post)
                .applicant(applicant)
                .faculty(faculty)
                .cohort(applicant.getCohort())
                .message(request.getMessage())
                .status(RequestStatus.PENDING)
                .build();

        TeamJoinRequest saved = joinRequestRepository.save(joinRequest);

        Team team = post.getTeam();
        User leader = teamMemberRepository.findByTeamIdAndRoleInTeam(team.getId(), TeamRole.LEADER)
                .map(TeamMember::getUser)
                .orElse(team.getLeader());
        if (leader != null) {
            String msgVi = (request.getMessage() != null && !request.getMessage().isBlank())
                    ? (": \"" + request.getMessage() + "\"") : ".";
            String msgEn = (request.getMessage() != null && !request.getMessage().isBlank())
                    ? (": \"" + request.getMessage() + "\"") : ".";
            notificationService.sendNotification(
                    leader,
                    applicant,
                    "[VI] Yêu cầu tham gia nhóm mới: " + team.getName() + " | [EN] New team join request: " + team.getName(),
                    "[VI] Sinh viên " + applicant.getFullName() + " đã gửi yêu cầu tham gia nhóm \"" + team.getName() + "\"" + msgVi + "\n"
                            + "[EN] Student " + applicant.getFullName() + " has requested to join team \"" + team.getName() + "\"" + msgEn
            );
        }

        return mapToJoinResponse(saved);
    }

    @Override
    @Transactional
    public TeamJoinRequestResponse reviewJoinRequest(Long requestId, RequestStatus decision, String reviewerEmail) {
        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseGet(() -> userRepository.findByUsername(reviewerEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + reviewerEmail)));

        TeamJoinRequest joinReq = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found with id: " + requestId));

        if (joinReq.getStatus() != RequestStatus.PENDING) {
            throw new IllegalArgumentException("Join request has already been reviewed");
        }

        Team team = joinReq.getPost().getTeam();
        if (team == null) {
            throw new IllegalArgumentException("Associated post has no team");
        }

        TeamMember leader = teamMemberRepository.findByTeamIdAndRoleInTeam(team.getId(), TeamRole.LEADER)
                .orElseThrow(() -> new IllegalArgumentException("Team leader not found"));

        if (!leader.getUser().getId().equals(reviewer.getId())) {
            throw new IllegalArgumentException("Only the team leader can review join requests");
        }

        if (decision != RequestStatus.ACCEPTED && decision != RequestStatus.REJECTED) {
            throw new IllegalArgumentException("Decision must be ACCEPTED or REJECTED");
        }

        joinReq.setStatus(decision);

        if (decision == RequestStatus.ACCEPTED) {
            long currentCount = teamMemberRepository.countByTeamId(team.getId());
            if (currentCount >= 3) {
                throw new IllegalArgumentException("Team is already at maximum capacity (3 members)");
            }

            User applicant = joinReq.getApplicant();

            // Add member to team
            TeamMember newMember = TeamMember.builder()
                    .team(team)
                    .user(applicant)
                    .roleInTeam(TeamRole.MEMBER)
                    .build();
            teamMemberRepository.save(newMember);

            // AUTO-CANCELLATION: cancel all other pending join requests and invitations for applicant
            joinRequestRepository.cancelAllPendingRequestsForApplicant(applicant.getId());
            invitationRepository.cancelAllPendingInvitationsForInvitee(applicant.getId());

            // Close student's looking-for-team post if open
            postRepository.findByAuthorId(applicant.getId()).stream()
                    .filter(p -> p.getPostType() == PostType.STUDENT_LOOKING_FOR_TEAM && p.getStatus() == PostStatus.OPEN)
                    .forEach(p -> {
                        p.setStatus(PostStatus.CLOSED);
                        postRepository.save(p);
                    });
        }

        TeamJoinRequest updated = joinRequestRepository.save(joinReq);

        User applicant = joinReq.getApplicant();
        if (applicant != null) {
            if (decision == RequestStatus.ACCEPTED) {
                notificationService.sendNotification(
                        applicant,
                        reviewer,
                        "[VI] Yêu cầu tham gia nhóm đã được chấp nhận | [EN] Team join request accepted",
                        "[VI] Chúc mừng! Yêu cầu tham gia nhóm \"" + team.getName() + "\" của bạn đã được trưởng nhóm chấp nhận.\n"
                                + "[EN] Congratulations! Your request to join team \"" + team.getName() + "\" has been accepted by the team leader."
                );
            } else {
                notificationService.sendNotification(
                        applicant,
                        reviewer,
                        "[VI] Yêu cầu tham gia nhóm đã bị từ chối | [EN] Team join request rejected",
                        "[VI] Yêu cầu tham gia nhóm \"" + team.getName() + "\" của bạn đã bị từ chối.\n"
                                + "[EN] Your request to join team \"" + team.getName() + "\" has been rejected."
                );
            }
        }

        return mapToJoinResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamJoinRequestResponse> getMyJoinRequests(String currentUserEmail) {
        User applicant = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + currentUserEmail)));

        return joinRequestRepository.findByApplicantId(applicant.getId()).stream()
                .map(this::mapToJoinResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamJoinRequestResponse> getPostJoinRequests(Long postId, String currentUserEmail) {
        return joinRequestRepository.findByPostId(postId).stream()
                .map(this::mapToJoinResponse)
                .collect(Collectors.toList());
    }

    private MatchmakingPostResponse mapToPostResponse(MatchmakingPost post) {
        FacultyResponse fac = post.getFaculty() != null
                ? new FacultyResponse(post.getFaculty().getId(), post.getFaculty().getName(), post.getFaculty().getCode())
                : null;
        CohortResponse coh = post.getCohort() != null
                ? new CohortResponse(post.getCohort().getId(), post.getCohort().getCode(), post.getCohort().getName(), post.getCohort().getAdmissionYear(), post.getCohort().getGraduationYear())
                : null;
        DepartmentResponse dep = post.getDepartment() != null
                ? new DepartmentResponse(post.getDepartment().getId(), post.getDepartment().getFaculty() != null ? post.getDepartment().getFaculty().getId() : null, post.getDepartment().getCode(), post.getDepartment().getName())
                : null;

        return MatchmakingPostResponse.builder()
                .id(post.getId())
                .postType(post.getPostType())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getFullName())
                .authorStudentCode(post.getAuthor().getStudentCode())
                .authorAvatarUrl(post.getAuthor().getAvatarUrl())
                .teamId(post.getTeam() != null ? post.getTeam().getId() : null)
                .teamName(post.getTeam() != null ? post.getTeam().getName() : null)
                .title(post.getTitle())
                .goals(post.getGoals())
                .department(dep)
                .faculty(fac)
                .cohort(coh)
                .slotsNeeded(post.getSlotsNeeded())
                .contactInfo(post.getContactInfo())
                .status(post.getStatus())
                .skills(post.getSkills() != null ? new HashSet<>(post.getSkills()) : new HashSet<>())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private TeamJoinRequestResponse mapToJoinResponse(TeamJoinRequest r) {
        FacultyResponse fac = r.getFaculty() != null
                ? new FacultyResponse(r.getFaculty().getId(), r.getFaculty().getName(), r.getFaculty().getCode())
                : null;
        CohortResponse coh = r.getCohort() != null
                ? new CohortResponse(r.getCohort().getId(), r.getCohort().getCode(), r.getCohort().getName(), r.getCohort().getAdmissionYear(), r.getCohort().getGraduationYear())
                : null;

        return new TeamJoinRequestResponse(
                r.getId(),
                r.getPost().getId(),
                r.getPost().getTitle(),
                r.getApplicant().getId(),
                r.getApplicant().getFullName(),
                r.getApplicant().getStudentCode(),
                r.getApplicant().getAvatarUrl(),
                r.getApplicant().getEmail(),
                r.getApplicant().getPhone(),
                fac,
                coh,
                r.getMessage(),
                r.getStatus(),
                r.getCreatedAt()
        );
    }
}
