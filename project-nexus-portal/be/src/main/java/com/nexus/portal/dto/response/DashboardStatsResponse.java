package com.nexus.portal.dto.response;

import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {
    private long totalUsers;
    private long activeUsers;
    private long totalRoles;
    private long systemUptimeSeconds;
    private long totalTopics;
    private long totalTeams;
    private long totalRegistrations;
    private long totalPeriods;
    private List<Map<String, Object>> recentActivities;
    private List<Map<String, Object>> recentNotifications;
    private Map<String, Long> userRoleDistribution;
    private Map<String, Long> topicStatusDistribution;
    private List<Map<String, Object>> timelineData;

    public DashboardStatsResponse() {
    }

    public DashboardStatsResponse(long totalUsers, long activeUsers, long totalRoles, long systemUptimeSeconds,
                                  long totalTopics, long totalTeams, long totalRegistrations, long totalPeriods,
                                  List<Map<String, Object>> recentActivities, List<Map<String, Object>> recentNotifications,
                                  Map<String, Long> userRoleDistribution, Map<String, Long> topicStatusDistribution,
                                  List<Map<String, Object>> timelineData) {
        this.totalUsers = totalUsers;
        this.activeUsers = activeUsers;
        this.totalRoles = totalRoles;
        this.systemUptimeSeconds = systemUptimeSeconds;
        this.totalTopics = totalTopics;
        this.totalTeams = totalTeams;
        this.totalRegistrations = totalRegistrations;
        this.totalPeriods = totalPeriods;
        this.recentActivities = recentActivities;
        this.recentNotifications = recentNotifications;
        this.userRoleDistribution = userRoleDistribution;
        this.topicStatusDistribution = topicStatusDistribution;
        this.timelineData = timelineData;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private long totalUsers;
        private long activeUsers;
        private long totalRoles;
        private long systemUptimeSeconds;
        private long totalTopics;
        private long totalTeams;
        private long totalRegistrations;
        private long totalPeriods;
        private List<Map<String, Object>> recentActivities;
        private List<Map<String, Object>> recentNotifications;
        private Map<String, Long> userRoleDistribution;
        private Map<String, Long> topicStatusDistribution;
        private List<Map<String, Object>> timelineData;

        public Builder totalUsers(long totalUsers) {
            this.totalUsers = totalUsers;
            return this;
        }

        public Builder activeUsers(long activeUsers) {
            this.activeUsers = activeUsers;
            return this;
        }

        public Builder totalRoles(long totalRoles) {
            this.totalRoles = totalRoles;
            return this;
        }

        public Builder systemUptimeSeconds(long systemUptimeSeconds) {
            this.systemUptimeSeconds = systemUptimeSeconds;
            return this;
        }

        public Builder totalTopics(long totalTopics) {
            this.totalTopics = totalTopics;
            return this;
        }

        public Builder totalTeams(long totalTeams) {
            this.totalTeams = totalTeams;
            return this;
        }

        public Builder totalRegistrations(long totalRegistrations) {
            this.totalRegistrations = totalRegistrations;
            return this;
        }

        public Builder totalPeriods(long totalPeriods) {
            this.totalPeriods = totalPeriods;
            return this;
        }

        public Builder recentActivities(List<Map<String, Object>> recentActivities) {
            this.recentActivities = recentActivities;
            return this;
        }

        public Builder recentNotifications(List<Map<String, Object>> recentNotifications) {
            this.recentNotifications = recentNotifications;
            return this;
        }

        public Builder userRoleDistribution(Map<String, Long> userRoleDistribution) {
            this.userRoleDistribution = userRoleDistribution;
            return this;
        }

        public Builder topicStatusDistribution(Map<String, Long> topicStatusDistribution) {
            this.topicStatusDistribution = topicStatusDistribution;
            return this;
        }

        public Builder timelineData(List<Map<String, Object>> timelineData) {
            this.timelineData = timelineData;
            return this;
        }

        public DashboardStatsResponse build() {
            return new DashboardStatsResponse(
                    totalUsers, activeUsers, totalRoles, systemUptimeSeconds,
                    totalTopics, totalTeams, totalRegistrations, totalPeriods,
                    recentActivities, recentNotifications,
                    userRoleDistribution, topicStatusDistribution, timelineData
            );
        }
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getTotalRoles() {
        return totalRoles;
    }

    public void setTotalRoles(long totalRoles) {
        this.totalRoles = totalRoles;
    }

    public long getSystemUptimeSeconds() {
        return systemUptimeSeconds;
    }

    public void setSystemUptimeSeconds(long systemUptimeSeconds) {
        this.systemUptimeSeconds = systemUptimeSeconds;
    }

    public long getTotalTopics() {
        return totalTopics;
    }

    public void setTotalTopics(long totalTopics) {
        this.totalTopics = totalTopics;
    }

    public long getTotalTeams() {
        return totalTeams;
    }

    public void setTotalTeams(long totalTeams) {
        this.totalTeams = totalTeams;
    }

    public long getTotalRegistrations() {
        return totalRegistrations;
    }

    public void setTotalRegistrations(long totalRegistrations) {
        this.totalRegistrations = totalRegistrations;
    }

    public long getTotalPeriods() {
        return totalPeriods;
    }

    public void setTotalPeriods(long totalPeriods) {
        this.totalPeriods = totalPeriods;
    }

    public List<Map<String, Object>> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<Map<String, Object>> recentActivities) {
        this.recentActivities = recentActivities;
    }

    public List<Map<String, Object>> getRecentNotifications() {
        return recentNotifications;
    }

    public void setRecentNotifications(List<Map<String, Object>> recentNotifications) {
        this.recentNotifications = recentNotifications;
    }

    public Map<String, Long> getUserRoleDistribution() {
        return userRoleDistribution;
    }

    public void setUserRoleDistribution(Map<String, Long> userRoleDistribution) {
        this.userRoleDistribution = userRoleDistribution;
    }

    public Map<String, Long> getTopicStatusDistribution() {
        return topicStatusDistribution;
    }

    public void setTopicStatusDistribution(Map<String, Long> topicStatusDistribution) {
        this.topicStatusDistribution = topicStatusDistribution;
    }

    public List<Map<String, Object>> getTimelineData() {
        return timelineData;
    }

    public void setTimelineData(List<Map<String, Object>> timelineData) {
        this.timelineData = timelineData;
    }
}
