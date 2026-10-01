package com.nexus.portal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserProfileUpdateRequest {

    @NotBlank(message = "Full name cannot be blank")
    @Size(max = 120, message = "Full name cannot exceed 120 characters")
    private String fullName;

    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    private String phone;

    @Size(max = 255, message = "Avatar URL cannot exceed 255 characters")
    private String avatarUrl;

    @Size(max = 30, message = "Student / Staff ID cannot exceed 30 characters")
    private String studentCode;

    public UserProfileUpdateRequest() {
    }

    public UserProfileUpdateRequest(String fullName, String phone, String avatarUrl, String studentCode) {
        this.fullName = fullName;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
        this.studentCode = studentCode;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }
}
