package com.nexus.portal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CohortRequest {

    @NotBlank(message = "Cohort code cannot be blank")
    @Size(max = 30, message = "Cohort code cannot exceed 30 characters")
    private String code;

    @NotBlank(message = "Cohort name cannot be blank")
    @Size(max = 100, message = "Cohort name cannot exceed 100 characters")
    private String name;

    @NotNull(message = "Admission year cannot be null")
    private Integer admissionYear;

    @NotNull(message = "Graduation year cannot be null")
    private Integer graduationYear;

    public CohortRequest() {
    }

    public CohortRequest(String code, String name, Integer admissionYear, Integer graduationYear) {
        this.code = code;
        this.name = name;
        this.admissionYear = admissionYear;
        this.graduationYear = graduationYear;
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

    public Integer getAdmissionYear() {
        return admissionYear;
    }

    public void setAdmissionYear(Integer admissionYear) {
        this.admissionYear = admissionYear;
    }

    public Integer getGraduationYear() {
        return graduationYear;
    }

    public void setGraduationYear(Integer graduationYear) {
        this.graduationYear = graduationYear;
    }
}
