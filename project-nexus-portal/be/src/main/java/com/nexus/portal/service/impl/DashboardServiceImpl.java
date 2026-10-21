package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.DashboardStatsResponse;
import com.nexus.portal.enums.*;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.DashboardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TopicRepository topicRepository;
    private final TeamRepository teamRepository;
    private final TopicRegistrationRepository topicRegistrationRepository;
    private final RegistrationPeriodRepository registrationPeriodRepository;
    private final NotificationRepository notificationRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final DefenseCouncilRepository defenseCouncilRepository;
    private final DefenseAssignmentRepository defenseAssignmentRepository;
    private final AssessmentRepository assessmentRepository;
    private final ProgressTaskRepository progressTaskRepository;
    private final ResultRepository resultRepository;

    public DashboardServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            TopicRepository topicRepository,
            TeamRepository teamRepository,
            TopicRegistrationRepository topicRegistrationRepository,
            RegistrationPeriodRepository registrationPeriodRepository,
            NotificationRepository notificationRepository,
            TeamMemberRepository teamMemberRepository,
            DefenseCouncilRepository defenseCouncilRepository,
            DefenseAssignmentRepository defenseAssignmentRepository,
            AssessmentRepository assessmentRepository,
            ProgressTaskRepository progressTaskRepository,
            ResultRepository resultRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.topicRepository = topicRepository;
        this.teamRepository = teamRepository;
        this.topicRegistrationRepository = topicRegistrationRepository;
        this.registrationPeriodRepository = registrationPeriodRepository;
        this.notificationRepository = notificationRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.defenseCouncilRepository = defenseCouncilRepository;
        this.defenseAssignmentRepository = defenseAssignmentRepository;
        this.assessmentRepository = assessmentRepository;
        this.progressTaskRepository = progressTaskRepository;
        this.resultRepository = resultRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        return getDashboardStats(null);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(String username) {
        List<User> users = userRepository.findAll();
        long totalUsers = users.size();
        long activeUsers = users.stream().filter(User::isActive).count();
        long totalRoles = roleRepository.count();

        List<Topic> allTopics = topicRepository.findAll();
        List<TopicRegistration> allRegistrations = topicRegistrationRepository.findAll();
        List<Team> allTeams = teamRepository.findAll();
        List<RegistrationPeriod> periods = registrationPeriodRepository.findAll();
        long totalPeriods = periods.size();

        long totalTopics = allTopics.size();
        long totalRegistrations = allRegistrations.size();
        long totalTeams = allTeams.size();

        // 1. Role distribution
        Map<String, Long> roleDistribution = new HashMap<>();
        for (User user : users) {
            for (Role role : user.getRoles()) {
                String roleName = role.getName().name();
                roleDistribution.put(roleName, roleDistribution.getOrDefault(roleName, 0L) + 1);
            }
        }

        // 2. Topic status distribution
        Map<String, Long> topicStatusDistribution = new HashMap<>();
        for (Topic topic : allTopics) {
            if (topic.getStatus() != null) {
                String statusName = topic.getStatus().name();
                topicStatusDistribution.put(statusName, topicStatusDistribution.getOrDefault(statusName, 0L) + 1);
            }
        }

        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;

        // 3. Real Recent activities
        List<Map<String, Object>> activities = new ArrayList<>();
        users.stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .forEach(u -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("username", u.getUsername());
                    item.put("fullName", u.getFullName() != null ? u.getFullName() : u.getUsername());
                    item.put("action", "User Registered");
                    item.put("timestamp", u.getCreatedAt() != null ? u.getCreatedAt() : LocalDateTime.now());
                    activities.add(item);
                });

        // 4. Real Recent notifications
        List<Map<String, Object>> recentNotifications = new ArrayList<>();
        List<Notification> notifications = notificationRepository.findAll();
        notifications.stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .forEach(n -> {
                    Map<String, Object> notif = new HashMap<>();
                    notif.put("id", n.getId());
                    notif.put("title", n.getTitle());
                    notif.put("content", n.getContent());
                    notif.put("authorName", n.getAuthor() != null ? n.getAuthor().getFullName() : "System");
                    notif.put("createdAt", n.getCreatedAt());
                    recentNotifications.add(notif);
                });

        // 5. Dynamic timeline data grouped strictly by Academic Semester (academicYear + semester)
        Map<String, List<RegistrationPeriod>> semesterGroups = new LinkedHashMap<>();
        periods.sort(Comparator
                .comparing(RegistrationPeriod::getAcademicYear, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(RegistrationPeriod::getSemester, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(RegistrationPeriod::getId));

        for (RegistrationPeriod p : periods) {
            String semKey = (p.getSemester() != null ? "HK" + p.getSemester() : "") +
                    (p.getAcademicYear() != null ? " (" + p.getAcademicYear() + ")" : "");
            if (semKey.isEmpty()) {
                semKey = p.getName();
            }
            semesterGroups.computeIfAbsent(semKey, k -> new ArrayList<>()).add(p);
        }

        List<Map<String, Object>> timeline = new ArrayList<>();
        for (Map.Entry<String, List<RegistrationPeriod>> entry : semesterGroups.entrySet()) {
            String semLabel = entry.getKey();
            List<RegistrationPeriod> group = entry.getValue();
            Set<Long> periodIds = group.stream().map(RegistrationPeriod::getId).collect(Collectors.toSet());

            long pTopics = allTopics.stream()
                    .filter(t -> t.getPeriod() != null && periodIds.contains(t.getPeriod().getId()))
                    .count();

            long pRegs = allRegistrations.stream()
                    .filter(r -> r.getTopic() != null && r.getTopic().getPeriod() != null && periodIds.contains(r.getTopic().getPeriod().getId()))
                    .count();

            Set<Long> userIds = new HashSet<>();
            for (Team tm : allTeams) {
                if (tm.getPeriod() != null && periodIds.contains(tm.getPeriod().getId())) {
                    if (tm.getLeader() != null) userIds.add(tm.getLeader().getId());
                    if (tm.getMembers() != null) {
                        tm.getMembers().forEach(m -> {
                            if (m.getUser() != null) userIds.add(m.getUser().getId());
                        });
                    }
                }
            }
            for (Topic t : allTopics) {
                if (t.getPeriod() != null && periodIds.contains(t.getPeriod().getId())) {
                    if (t.getTopicLecturers() != null) {
                        t.getTopicLecturers().forEach(tl -> {
                            if (tl.getLecturer() != null) userIds.add(tl.getLecturer().getId());
                        });
                    }
                }
            }

            RegistrationPeriod primaryPeriod = group.get(0);
            String fullSemesterName = (primaryPeriod.getSemester() != null ? "Học kỳ " + primaryPeriod.getSemester() : "Học kỳ") +
                    (primaryPeriod.getAcademicYear() != null ? " (" + primaryPeriod.getAcademicYear() + ")" : "");

            Map<String, Object> point = new HashMap<>();
            point.put("periodId", primaryPeriod.getId());
            point.put("day", semLabel);
            point.put("semester", fullSemesterName);
            point.put("academicYear", primaryPeriod.getAcademicYear());
            point.put("term", primaryPeriod.getSemester());
            point.put("status", primaryPeriod.getStatus() != null ? primaryPeriod.getStatus().name() : "");
            point.put("users", (long) userIds.size());
            point.put("topics", pTopics);
            point.put("registrations", pRegs);
            timeline.add(point);
        }

        // 6. Role-specific scoped metrics calculation
        User resolvedUser = null;
        if (username != null) {
            resolvedUser = userRepository.findByUsername(username)
                    .or(() -> userRepository.findByEmail(username))
                    .orElse(null);
        }
        if (resolvedUser == null) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                if (auth.getPrincipal() instanceof com.nexus.portal.security.UserPrincipal up) {
                    resolvedUser = userRepository.findById(up.getId()).orElse(null);
                } else if (auth.getName() != null) {
                    String principalName = auth.getName();
                    resolvedUser = userRepository.findByUsername(principalName)
                            .or(() -> userRepository.findByEmail(principalName))
                            .orElse(null);
                }
            }
        }
        final User currentUser = resolvedUser;
        String currentRole = "ROLE_ADMIN";
        Map<String, Object> scopedStats = new HashMap<>();

        if (currentUser != null && currentUser.getRoles() != null) {
            Set<String> roleNames = currentUser.getRoles().stream()
                    .map(r -> r.getName().name())
                    .collect(Collectors.toSet());

            if (roleNames.contains("ROLE_ADMIN")) {
                currentRole = "ROLE_ADMIN";
            } else if (roleNames.contains("ROLE_PRINCIPAL")) {
                currentRole = "ROLE_PRINCIPAL";
            } else if (roleNames.contains("ROLE_TEACHER")) {
                currentRole = "ROLE_TEACHER";
            } else if (roleNames.contains("ROLE_COUNCIL")) {
                currentRole = "ROLE_COUNCIL";
            } else {
                currentRole = "ROLE_USER";
            }
        }

        scopedStats.put("role", currentRole);

        if ("ROLE_PRINCIPAL".equals(currentRole)) {
            // Principal / Dean Scoped Metrics
            long pendingTopicsCount = allTopics.stream().filter(t -> t.getStatus() == TopicStatus.PENDING_APPROVAL).count();
            long approvedTopicsCount = allTopics.stream().filter(t -> t.getStatus() != TopicStatus.PENDING_APPROVAL).count();
            long openPeriodsCount = periods.stream().filter(p -> p.getStatus() == PeriodStatus.OPEN).count();
            List<DefenseCouncil> allCouncils = defenseCouncilRepository.findAllByOrderByStartsAtDesc();
            long totalCouncils = allCouncils.size();

            scopedStats.put("totalTopics", totalTopics);
            scopedStats.put("pendingTopicsCount", pendingTopicsCount);
            scopedStats.put("approvedTopicsCount", approvedTopicsCount);
            scopedStats.put("totalTeams", totalTeams);
            scopedStats.put("openPeriodsCount", openPeriodsCount);
            scopedStats.put("totalCouncils", totalCouncils);
            scopedStats.put("totalRegistrations", totalRegistrations);

            List<Map<String, Object>> pendingTopicsList = allTopics.stream()
                    .filter(t -> t.getStatus() == TopicStatus.PENDING_APPROVAL)
                    .limit(5)
                    .map(t -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("id", t.getId());
                        item.put("title", t.getTitle());
                        item.put("departmentName", t.getDepartment() != null ? t.getDepartment().getName() : "");
                        item.put("periodName", t.getPeriod() != null ? t.getPeriod().getName() : "");
                        String lecturerName = "Chưa phân công";
                        if (t.getTopicLecturers() != null && !t.getTopicLecturers().isEmpty()) {
                            TopicLecturer tl = t.getTopicLecturers().iterator().next();
                            if (tl.getLecturer() != null) lecturerName = tl.getLecturer().getFullName();
                        }
                        item.put("lecturerName", lecturerName);
                        return item;
                    }).toList();
            scopedStats.put("pendingTopicsList", pendingTopicsList);

        } else if ("ROLE_TEACHER".equals(currentRole) && currentUser != null) {
            // Teacher / Lecturer Scoped Metrics
            List<Topic> myTopics = topicRepository.findByLecturerId(currentUser.getId());
            long myTopicsCount = myTopics.size();
            long myApprovedTopicsCount = myTopics.stream().filter(t -> t.getStatus() != TopicStatus.PENDING_APPROVAL).count();
            long myPendingTopicsCount = myTopics.stream().filter(t -> t.getStatus() == TopicStatus.PENDING_APPROVAL).count();

            Set<Long> myTopicIds = myTopics.stream().map(Topic::getId).collect(Collectors.toSet());
            List<TopicRegistration> myTopicRegistrations = allRegistrations.stream()
                    .filter(r -> r.getTopic() != null && myTopicIds.contains(r.getTopic().getId()))
                    .toList();

            long pendingRegistrationsCount = myTopicRegistrations.stream().filter(r -> r.getStatus() == RegistrationStatus.PENDING).count();
            long guidedTeamsCount = myTopicRegistrations.stream().filter(r -> r.getStatus() == RegistrationStatus.APPROVED).count();

            List<DefenseCouncil> allCouncils = defenseCouncilRepository.findAllByOrderByStartsAtDesc();
            long myCouncilsCount = allCouncils.stream()
                    .filter(c -> c.getMembers() != null && c.getMembers().stream().anyMatch(m -> m.getLecturer() != null && m.getLecturer().getId().equals(currentUser.getId())))
                    .count();

            Set<Long> guidedTeamIds = myTopicRegistrations.stream()
                    .filter(r -> r.getStatus() == RegistrationStatus.APPROVED && r.getTeam() != null)
                    .map(r -> r.getTeam().getId())
                    .collect(Collectors.toSet());
            long pendingTasksCount = guidedTeamIds.stream()
                    .mapToLong(teamId -> progressTaskRepository.findByTeamIdOrderByDueDateAsc(teamId).stream().filter(t -> t.getStatus() != ProgressStatus.DONE).count())
                    .sum();

            scopedStats.put("myTopicsCount", myTopicsCount);
            scopedStats.put("myApprovedTopicsCount", myApprovedTopicsCount);
            scopedStats.put("myPendingTopicsCount", myPendingTopicsCount);
            scopedStats.put("guidedTeamsCount", guidedTeamsCount);
            scopedStats.put("pendingRegistrationsCount", pendingRegistrationsCount);
            scopedStats.put("myCouncilsCount", myCouncilsCount);
            scopedStats.put("pendingTasksCount", pendingTasksCount);

            List<Map<String, Object>> pendingRegistrationsList = myTopicRegistrations.stream()
                    .filter(r -> r.getStatus() == RegistrationStatus.PENDING)
                    .limit(5)
                    .map(r -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("id", r.getId());
                        item.put("teamName", r.getTeam() != null ? r.getTeam().getName() : "");
                        item.put("topicTitle", r.getTopic() != null ? r.getTopic().getTitle() : "");
                        item.put("registeredAt", r.getRegisteredAt());
                        item.put("message", r.getMessage());
                        return item;
                    }).toList();
            scopedStats.put("pendingRegistrationsList", pendingRegistrationsList);

            List<Map<String, Object>> myTopicsList = myTopics.stream()
                    .limit(5)
                    .map(t -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("id", t.getId());
                        item.put("title", t.getTitle());
                        item.put("status", t.getStatus() != null ? t.getStatus().name() : "");
                        item.put("periodName", t.getPeriod() != null ? t.getPeriod().getName() : "");
                        return item;
                    }).toList();
            scopedStats.put("myTopicsList", myTopicsList);

        } else if ("ROLE_COUNCIL".equals(currentRole) && currentUser != null) {
            // Council Member Scoped Metrics
            List<DefenseCouncil> allCouncils = defenseCouncilRepository.findAllByOrderByStartsAtDesc();
            List<DefenseCouncil> myCouncils = allCouncils.stream()
                    .filter(c -> c.getMembers() != null && c.getMembers().stream().anyMatch(m -> m.getLecturer() != null && m.getLecturer().getId().equals(currentUser.getId())))
                    .toList();
            long assignedCouncilsCount = myCouncils.size();
            long completedCouncilsCount = myCouncils.stream().filter(c -> c.getStatus() == CouncilStatus.COMPLETED).count();

            long assignedTopicsCount = myCouncils.stream()
                    .mapToLong(c -> defenseAssignmentRepository.findByCouncilId(c.getId()).size())
                    .sum();

            long completedAssessments = assessmentRepository.findAll().stream()
                    .filter(a -> a.getEvaluator() != null && a.getEvaluator().getId().equals(currentUser.getId()) && a.getStatus() == AssessmentStatus.SUBMITTED)
                    .count();

            long pendingAssessments = Math.max(0, assignedTopicsCount - completedAssessments);
            int completionRate = assignedTopicsCount > 0 ? (int) Math.min(100, Math.round((double) completedAssessments / assignedTopicsCount * 100)) : 100;

            scopedStats.put("assignedCouncilsCount", assignedCouncilsCount);
            scopedStats.put("completedCouncilsCount", completedCouncilsCount);
            scopedStats.put("assignedTopicsCount", assignedTopicsCount);
            scopedStats.put("completedAssessments", completedAssessments);
            scopedStats.put("pendingAssessments", pendingAssessments);
            scopedStats.put("completionRate", completionRate);

            List<Map<String, Object>> upcomingCouncils = myCouncils.stream()
                    .limit(5)
                    .map(c -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("id", c.getId());
                        item.put("name", c.getName());
                        item.put("room", c.getRoom());
                        item.put("startsAt", c.getStartsAt());
                        item.put("endsAt", c.getEndsAt());
                        item.put("status", c.getStatus() != null ? c.getStatus().name() : "");
                        String myRoleInCouncil = c.getMembers().stream()
                                .filter(m -> m.getLecturer() != null && m.getLecturer().getId().equals(currentUser.getId()))
                                .findFirst()
                                .map(m -> m.getRole() != null ? m.getRole().name() : "MEMBER")
                                .orElse("MEMBER");
                        item.put("councilRole", myRoleInCouncil);
                        return item;
                    }).toList();
            scopedStats.put("upcomingCouncils", upcomingCouncils);

        } else if ("ROLE_USER".equals(currentRole) && currentUser != null) {
            // Student Scoped Metrics
            final Long uid = currentUser.getId();
            Team myTeam = null;

            // 1. Search in memory allTeams for either Leader or Member
            for (Team t : allTeams) {
                boolean isLeader = t.getLeader() != null && t.getLeader().getId().equals(uid);
                boolean isMember = t.getMembers() != null && t.getMembers().stream()
                        .anyMatch(m -> m.getUser() != null && m.getUser().getId().equals(uid));
                if (isLeader || isMember) {
                    myTeam = t;
                    break;
                }
            }

            // 2. Query by user teams repository if not found
            if (myTeam == null) {
                List<Team> userTeams = teamRepository.findAllTeamsByUserId(uid);
                if (!userTeams.isEmpty()) {
                    myTeam = userTeams.get(0);
                }
            }

            // 3. Query by team member repository if not found
            if (myTeam == null) {
                List<TeamMember> tms = teamMemberRepository.findByUserId(uid);
                if (!tms.isEmpty() && tms.get(0).getTeam() != null) {
                    myTeam = tms.get(0).getTeam();
                }
            }

            boolean hasTeam = myTeam != null;
            String teamName = hasTeam ? myTeam.getName() : "Chưa có nhóm";
            int memberCount = 1;
            if (hasTeam) {
                if (myTeam.getMembers() != null && !myTeam.getMembers().isEmpty()) {
                    memberCount = myTeam.getMembers().size();
                } else {
                    long count = teamMemberRepository.countByTeamId(myTeam.getId());
                    memberCount = count > 0 ? (int) count : 1;
                }
            }

            String topicTitle = "Chưa đăng ký đề tài";
            String registrationStatus = "NONE";
            String advisorName = "Chưa phân công";
            String councilRoom = "Chưa xếp lịch";
            String defenseSchedule = "Chờ xếp lịch";
            String resultSummary = "Chưa công bố";
            boolean passed = false;
            BigDecimal finalScore = null;

            int totalTasks = 0;
            int completedTasks = 0;
            int progressPercent = 0;

            if (hasTeam) {
                List<TopicRegistration> teamRegs = topicRegistrationRepository.findByTeamId(myTeam.getId());
                TopicRegistration approvedReg = teamRegs.stream().filter(r -> r.getStatus() == RegistrationStatus.APPROVED).findFirst().orElse(null);
                TopicRegistration activeReg = approvedReg != null ? approvedReg : (teamRegs.isEmpty() ? null : teamRegs.get(0));

                if (activeReg != null && activeReg.getTopic() != null) {
                    topicTitle = activeReg.getTopic().getTitle();
                    registrationStatus = activeReg.getStatus().name();
                    if (activeReg.getTopic().getTopicLecturers() != null && !activeReg.getTopic().getTopicLecturers().isEmpty()) {
                        TopicLecturer tl = activeReg.getTopic().getTopicLecturers().iterator().next();
                        if (tl.getLecturer() != null) advisorName = tl.getLecturer().getFullName();
                    }
                }

                List<ProgressTask> tasks = progressTaskRepository.findByTeamIdOrderByDueDateAsc(myTeam.getId());
                totalTasks = tasks.size();
                completedTasks = (int) tasks.stream().filter(t -> t.getStatus() == ProgressStatus.DONE).count();
                progressPercent = totalTasks > 0 ? (int) Math.round((double) completedTasks / totalTasks * 100) : 0;

                if (approvedReg != null) {
                    Optional<DefenseAssignment> daOpt = defenseAssignmentRepository.findByRegistrationId(approvedReg.getId());
                    if (daOpt.isPresent() && daOpt.get().getCouncil() != null) {
                        DefenseCouncil dc = daOpt.get().getCouncil();
                        if (dc.getRoom() != null && !dc.getRoom().isBlank()) {
                            councilRoom = dc.getRoom();
                        }
                        if (dc.getStartsAt() != null) {
                            defenseSchedule = dc.getName() + " (" + dc.getStartsAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + ")";
                        }
                    }
                }
            }

            List<Result> studentResults = resultRepository.findByStudentIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(currentUser.getId());
            if (!studentResults.isEmpty()) {
                Result res = studentResults.get(0);
                finalScore = res.getFinalScore();
                passed = res.isPassed();
                resultSummary = (passed ? "Đạt" : "Chưa đạt") + " (" + finalScore + "/10)";
            }

            scopedStats.put("hasTeam", hasTeam);
            scopedStats.put("teamName", teamName);
            scopedStats.put("memberCount", memberCount);
            scopedStats.put("topicTitle", topicTitle);
            scopedStats.put("registrationStatus", registrationStatus);
            scopedStats.put("advisorName", advisorName);
            scopedStats.put("councilRoom", councilRoom);
            scopedStats.put("defenseSchedule", defenseSchedule);
            scopedStats.put("totalTasks", totalTasks);
            scopedStats.put("completedTasks", completedTasks);
            scopedStats.put("progressPercent", progressPercent);
            scopedStats.put("finalScore", finalScore);
            scopedStats.put("passed", passed);
            scopedStats.put("resultSummary", resultSummary);
        } else {
            // Default ADMIN Scoped Metrics
            scopedStats.put("totalUsers", totalUsers);
            scopedStats.put("activeUsers", activeUsers);
            scopedStats.put("totalTopics", totalTopics);
            scopedStats.put("totalTeams", totalTeams);
            scopedStats.put("totalRoles", totalRoles);
            scopedStats.put("systemUptimeSeconds", uptimeSeconds);
            scopedStats.put("totalPeriods", totalPeriods);
            scopedStats.put("totalRegistrations", totalRegistrations);
        }

        return DashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalRoles(totalRoles)
                .systemUptimeSeconds(uptimeSeconds)
                .totalTopics(totalTopics)
                .totalTeams(totalTeams)
                .totalRegistrations(totalRegistrations)
                .totalPeriods(totalPeriods)
                .userRoleDistribution(roleDistribution)
                .topicStatusDistribution(topicStatusDistribution)
                .timelineData(timeline)
                .recentActivities(activities)
                .recentNotifications(recentNotifications)
                .currentRole(currentRole)
                .scopedStats(scopedStats)
                .build();
    }
}
