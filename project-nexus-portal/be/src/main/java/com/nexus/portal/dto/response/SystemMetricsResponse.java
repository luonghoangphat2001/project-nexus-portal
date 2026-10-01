package com.nexus.portal.dto.response;

import java.util.Map;

public class SystemMetricsResponse {

    // JVM Metrics
    private long totalMemoryBytes;
    private long freeMemoryBytes;
    private long usedMemoryBytes;
    private long maxMemoryBytes;
    private int availableProcessors;
    private String jvmVersion;
    private long uptimeSeconds;

    // Database & Entity counts
    private boolean databaseConnected;
    private long totalUsers;
    private long activeUsers;
    private long totalRoles;
    private long totalFaculties;
    private long totalDepartments;
    private long totalMajors;
    private long totalCohorts;
    private long totalTopics;
    private long totalTeams;
    private long totalMatchmakingPosts;
    private long totalAuditLogs;

    // Additional dynamic metrics
    private Map<String, Long> usersByRole;

    public SystemMetricsResponse() {
    }

    public long getTotalMemoryBytes() {
        return totalMemoryBytes;
    }

    public void setTotalMemoryBytes(long totalMemoryBytes) {
        this.totalMemoryBytes = totalMemoryBytes;
    }

    public long getFreeMemoryBytes() {
        return freeMemoryBytes;
    }

    public void setFreeMemoryBytes(long freeMemoryBytes) {
        this.freeMemoryBytes = freeMemoryBytes;
    }

    public long getUsedMemoryBytes() {
        return usedMemoryBytes;
    }

    public void setUsedMemoryBytes(long usedMemoryBytes) {
        this.usedMemoryBytes = usedMemoryBytes;
    }

    public long getMaxMemoryBytes() {
        return maxMemoryBytes;
    }

    public void setMaxMemoryBytes(long maxMemoryBytes) {
        this.maxMemoryBytes = maxMemoryBytes;
    }

    public int getAvailableProcessors() {
        return availableProcessors;
    }

    public void setAvailableProcessors(int availableProcessors) {
        this.availableProcessors = availableProcessors;
    }

    public String getJvmVersion() {
        return jvmVersion;
    }

    public void setJvmVersion(String jvmVersion) {
        this.jvmVersion = jvmVersion;
    }

    public long getUptimeSeconds() {
        return uptimeSeconds;
    }

    public void setUptimeSeconds(long uptimeSeconds) {
        this.uptimeSeconds = uptimeSeconds;
    }

    public boolean isDatabaseConnected() {
        return databaseConnected;
    }

    public void setDatabaseConnected(boolean databaseConnected) {
        this.databaseConnected = databaseConnected;
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

    public long getTotalFaculties() {
        return totalFaculties;
    }

    public void setTotalFaculties(long totalFaculties) {
        this.totalFaculties = totalFaculties;
    }

    public long getTotalDepartments() {
        return totalDepartments;
    }

    public void setTotalDepartments(long totalDepartments) {
        this.totalDepartments = totalDepartments;
    }

    public long getTotalMajors() {
        return totalMajors;
    }

    public void setTotalMajors(long totalMajors) {
        this.totalMajors = totalMajors;
    }

    public long getTotalCohorts() {
        return totalCohorts;
    }

    public void setTotalCohorts(long totalCohorts) {
        this.totalCohorts = totalCohorts;
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

    public long getTotalMatchmakingPosts() {
        return totalMatchmakingPosts;
    }

    public void setTotalMatchmakingPosts(long totalMatchmakingPosts) {
        this.totalMatchmakingPosts = totalMatchmakingPosts;
    }

    public long getTotalAuditLogs() {
        return totalAuditLogs;
    }

    public void setTotalAuditLogs(long totalAuditLogs) {
        this.totalAuditLogs = totalAuditLogs;
    }

    public Map<String, Long> getUsersByRole() {
        return usersByRole;
    }

    public void setUsersByRole(Map<String, Long> usersByRole) {
        this.usersByRole = usersByRole;
    }
}
