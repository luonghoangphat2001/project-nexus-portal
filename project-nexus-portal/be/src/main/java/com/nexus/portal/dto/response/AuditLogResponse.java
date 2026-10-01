package com.nexus.portal.dto.response;

import java.time.LocalDateTime;

public class AuditLogResponse {

    private Long id;
    private Long userId;
    private String username;
    private String action;
    private String resource;
    private String details;
    private String ipAddress;
    private String userAgent;
    private String status;
    private LocalDateTime createdAt;

    public AuditLogResponse() {
    }

    public AuditLogResponse(Long id, Long userId, String username, String action, String resource, String details, String ipAddress, String userAgent, String status, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.action = action;
        this.resource = resource;
        this.details = details;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getResource() {
        return resource;
    }

    public void setResource(String resource) {
        this.resource = resource;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
