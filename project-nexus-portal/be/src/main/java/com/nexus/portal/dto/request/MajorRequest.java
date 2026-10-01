package com.nexus.portal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class MajorRequest {

    @NotNull(message = "Department ID cannot be null")
    private Long departmentId;

    @NotBlank(message = "Major code cannot be blank")
    @Size(max = 30, message = "Major code cannot exceed 30 characters")
    private String code;

    @NotBlank(message = "Major name cannot be blank")
    @Size(max = 120, message = "Major name cannot exceed 120 characters")
    private String name;

    public MajorRequest() {
    }

    public MajorRequest(Long departmentId, String code, String name) {
        this.departmentId = departmentId;
        this.code = code;
        this.name = name;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
