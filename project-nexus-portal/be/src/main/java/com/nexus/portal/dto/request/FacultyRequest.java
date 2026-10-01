package com.nexus.portal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class FacultyRequest {

    @NotBlank(message = "Faculty code cannot be blank")
    @Size(max = 30, message = "Faculty code cannot exceed 30 characters")
    private String code;

    @NotBlank(message = "Faculty name cannot be blank")
    @Size(max = 120, message = "Faculty name cannot exceed 120 characters")
    private String name;

    public FacultyRequest() {
    }

    public FacultyRequest(String code, String name) {
        this.code = code;
        this.name = name;
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
