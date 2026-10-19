package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.DashboardStatsResponse;
import com.nexus.portal.model.Notification;
import com.nexus.portal.model.RegistrationPeriod;
import com.nexus.portal.model.Role;
import com.nexus.portal.model.Team;
import com.nexus.portal.model.Topic;
import com.nexus.portal.model.TopicRegistration;
import com.nexus.portal.model.User;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.DashboardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
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

    public DashboardServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            TopicRepository topicRepository,
            TeamRepository teamRepository,
            TopicRegistrationRepository topicRegistrationRepository,
            RegistrationPeriodRepository registrationPeriodRepository,
            NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.topicRepository = topicRepository;
        this.teamRepository = teamRepository;
        this.topicRegistrationRepository = topicRegistrationRepository;
        this.registrationPeriodRepository = registrationPeriodRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
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

        // 5. Dynamic timeline data computed directly from database records for each RegistrationPeriod
        // 5. Dynamic timeline data grouped strictly by Academic Semester (academicYear + semester)
        // Groups multiple registration periods (e.g. Capstone + Thesis) within the same semester into one timeline point
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
                .build();
    }
}
