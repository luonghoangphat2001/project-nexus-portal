package com.nexus.portal.dto.response;

import java.time.LocalDateTime;
import java.util.Set;

public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String studentCode;
    private String phone;
    private String avatarUrl;
    private boolean active;
    private Set<String> roles;
    private String majorName;
    private String cohortName;
    private String facultyName;
    private String departmentName;
    private Long teamId;
    private String teamName;
    private String roleInTeam;
    private String topicTitle;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, String email, String fullName, String studentCode,
                        String phone, String avatarUrl, boolean active, Set<String> roles,
                        String majorName, String cohortName, String facultyName, String departmentName,
                        Long teamId, String teamName, String roleInTeam, String topicTitle,
                        LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.studentCode = studentCode;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
        this.active = active;
        this.roles = roles;
        this.majorName = majorName;
        this.cohortName = cohortName;
        this.facultyName = facultyName;
        this.departmentName = departmentName;
        this.teamId = teamId;
        this.teamName = teamName;
        this.roleInTeam = roleInTeam;
        this.topicTitle = topicTitle;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UserResponse(Long id, String username, String email, String fullName, String avatarUrl, boolean active, Set<String> roles, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, username, email, fullName, null, null, avatarUrl, active, roles, null, null, null, null, null, null, null, null, createdAt, updatedAt);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private String studentCode;
        private String phone;
        private String avatarUrl;
        private boolean active;
        private Set<String> roles;
        private String majorName;
        private String cohortName;
        private String facultyName;
        private String departmentName;
        private Long teamId;
        private String teamName;
        private String roleInTeam;
        private String topicTitle;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public Builder studentCode(String studentCode) {
            this.studentCode = studentCode;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder avatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
            return this;
        }

        public Builder active(boolean active) {
            this.active = active;
            return this;
        }

        public Builder roles(Set<String> roles) {
            this.roles = roles;
            return this;
        }

        public Builder majorName(String majorName) {
            this.majorName = majorName;
            return this;
        }

        public Builder cohortName(String cohortName) {
            this.cohortName = cohortName;
            return this;
        }

        public Builder facultyName(String facultyName) {
            this.facultyName = facultyName;
            return this;
        }

        public Builder departmentName(String departmentName) {
            this.departmentName = departmentName;
            return this;
        }

        public Builder teamId(Long teamId) {
            this.teamId = teamId;
            return this;
        }

        public Builder teamName(String teamName) {
            this.teamName = teamName;
            return this;
        }

        public Builder roleInTeam(String roleInTeam) {
            this.roleInTeam = roleInTeam;
            return this;
        }

        public Builder topicTitle(String topicTitle) {
            this.topicTitle = topicTitle;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public UserResponse build() {
            return new UserResponse(id, username, email, fullName, studentCode, phone, avatarUrl, active, roles,
                    majorName, cohortName, facultyName, departmentName, teamId, teamName, roleInTeam, topicTitle,
                    createdAt, updatedAt);
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public String getMajorName() {
        return majorName;
    }

    public void setMajorName(String majorName) {
        this.majorName = majorName;
    }

    public String getCohortName() {
        return cohortName;
    }

    public void setCohortName(String cohortName) {
        this.cohortName = cohortName;
    }

    public String getFacultyName() {
        return facultyName;
    }

    public void setFacultyName(String facultyName) {
        this.facultyName = facultyName;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getRoleInTeam() {
        return roleInTeam;
    }

    public void setRoleInTeam(String roleInTeam) {
        this.roleInTeam = roleInTeam;
    }

    public String getTopicTitle() {
        return topicTitle;
    }

    public void setTopicTitle(String topicTitle) {
        this.topicTitle = topicTitle;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
