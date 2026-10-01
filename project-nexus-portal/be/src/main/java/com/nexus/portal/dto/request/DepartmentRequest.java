package com.nexus.portal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class DepartmentRequest {

    @NotNull(message = "Faculty ID cannot be null")
    private Long facultyId;

    @NotBlank(message = "Department code cannot be blank")
    @Size(max = 30, message = "Department code cannot exceed 30 characters")
    private String code;

    @NotBlank(message = "Department name cannot be blank")
    @Size(max = 120, message = "Department name cannot exceed 120 characters")
    private String name;

    public DepartmentRequest() {
    }

    public DepartmentRequest(Long facultyId, String code, String name) {
        this.facultyId = facultyId;
        this.code = code;
        this.name = name;
    }

    public Long getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(Long facultyId) {
        this.facultyId = facultyId;
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
