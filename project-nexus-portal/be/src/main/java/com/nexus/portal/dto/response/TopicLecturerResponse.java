package com.nexus.portal.dto.response;

import com.nexus.portal.enums.AdvisorRole;

public class TopicLecturerResponse {
    private Long lecturerId;
    private String fullName;
    private String email;
    private String avatarUrl;
    private AdvisorRole role;

    public TopicLecturerResponse() {
    }

    public TopicLecturerResponse(Long lecturerId, String fullName, String email, String avatarUrl, AdvisorRole role) {
        this.lecturerId = lecturerId;
        this.fullName = fullName;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.role = role;
    }

    public Long getLecturerId() {
        return lecturerId;
    }

    public void setLecturerId(Long lecturerId) {
        this.lecturerId = lecturerId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getLecturerName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public AdvisorRole getRole() {
        return role;
    }

    public AdvisorRole getAdvisorRole() {
        return role;
    }

    public void setRole(AdvisorRole role) {
        this.role = role;
    }
}
