package com.nexus.portal.controller;

import com.nexus.portal.dto.request.CohortRequest;
import com.nexus.portal.dto.request.DepartmentRequest;
import com.nexus.portal.dto.request.FacultyRequest;
import com.nexus.portal.dto.request.MajorRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.service.AcademicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/academic")
@Tag(name = "Academic Master Data", description = "Endpoints for academic faculties, departments, majors, and cohorts")
public class AcademicController {

    private final AcademicService academicService;

    public AcademicController(AcademicService academicService) {
        this.academicService = academicService;
    }

    // -----------------------------------------------------------------
    // Faculties
    // -----------------------------------------------------------------
    @GetMapping("/faculties")
    @Operation(summary = "Get all faculties", description = "Retrieve list of all faculties")
    public ResponseEntity<ApiResponse<List<FacultyResponse>>> getAllFaculties() {
        List<FacultyResponse> faculties = academicService.getAllFaculties();
        return ResponseEntity.ok(ApiResponse.success(faculties, "Faculties retrieved successfully"));
    }

    @PostMapping("/faculties")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Create new faculty", description = "Admin / Principal creates a new academic faculty")
    public ResponseEntity<ApiResponse<FacultyResponse>> createFaculty(
            @Valid @RequestBody FacultyRequest request, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        FacultyResponse response = academicService.createFaculty(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response, "Faculty created successfully"));
    }

    @PutMapping("/faculties/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Update faculty", description = "Admin / Principal updates faculty info")
    public ResponseEntity<ApiResponse<FacultyResponse>> updateFaculty(
            @PathVariable Long id, @Valid @RequestBody FacultyRequest request, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        FacultyResponse response = academicService.updateFaculty(id, request, user);
        return ResponseEntity.ok(ApiResponse.success(response, "Faculty updated successfully"));
    }

    @DeleteMapping("/faculties/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete faculty", description = "Admin deletes an empty faculty")
    public ResponseEntity<ApiResponse<Void>> deleteFaculty(@PathVariable Long id, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        academicService.deleteFaculty(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Faculty deleted successfully"));
    }

    // -----------------------------------------------------------------
    // Departments
    // -----------------------------------------------------------------
    @GetMapping("/departments")
    @Operation(summary = "Get departments by faculty", description = "Retrieve departments for a specific faculty ID")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getDepartments(
            @Parameter(description = "Faculty ID", required = true) @RequestParam Long facultyId) {
        List<DepartmentResponse> departments = academicService.getDepartmentsByFaculty(facultyId);
        return ResponseEntity.ok(ApiResponse.success(departments, "Departments retrieved successfully"));
    }

    @GetMapping("/departments/all")
    @Operation(summary = "Get all departments", description = "Retrieve all departments across all faculties")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getAllDepartments() {
        List<DepartmentResponse> departments = academicService.getAllDepartments();
        return ResponseEntity.ok(ApiResponse.success(departments, "All departments retrieved successfully"));
    }

    @PostMapping("/departments")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Create department", description = "Admin / Principal creates a new department under a faculty")
    public ResponseEntity<ApiResponse<DepartmentResponse>> createDepartment(
            @Valid @RequestBody DepartmentRequest request, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        DepartmentResponse response = academicService.createDepartment(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response, "Department created successfully"));
    }

    @PutMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Update department", description = "Admin / Principal updates department info")
    public ResponseEntity<ApiResponse<DepartmentResponse>> updateDepartment(
            @PathVariable Long id, @Valid @RequestBody DepartmentRequest request, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        DepartmentResponse response = academicService.updateDepartment(id, request, user);
        return ResponseEntity.ok(ApiResponse.success(response, "Department updated successfully"));
    }

    @DeleteMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete department", description = "Admin deletes an empty department")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        academicService.deleteDepartment(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Department deleted successfully"));
    }

    // -----------------------------------------------------------------
    // Majors
    // -----------------------------------------------------------------
    @GetMapping("/majors")
    @Operation(summary = "Get majors by department", description = "Retrieve majors for a specific department ID")
    public ResponseEntity<ApiResponse<List<MajorResponse>>> getMajors(
            @Parameter(description = "Department ID", required = true) @RequestParam Long departmentId) {
        List<MajorResponse> majors = academicService.getMajorsByDepartment(departmentId);
        return ResponseEntity.ok(ApiResponse.success(majors, "Majors retrieved successfully"));
    }

    @GetMapping("/majors/all")
    @Operation(summary = "Get all majors", description = "Retrieve all majors across all departments")
    public ResponseEntity<ApiResponse<List<MajorResponse>>> getAllMajors() {
        List<MajorResponse> majors = academicService.getAllMajors();
        return ResponseEntity.ok(ApiResponse.success(majors, "All majors retrieved successfully"));
    }

    @PostMapping("/majors")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Create major", description = "Admin / Principal creates a new academic major")
    public ResponseEntity<ApiResponse<MajorResponse>> createMajor(
            @Valid @RequestBody MajorRequest request, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        MajorResponse response = academicService.createMajor(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response, "Major created successfully"));
    }

    @PutMapping("/majors/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Update major", description = "Admin / Principal updates major info")
    public ResponseEntity<ApiResponse<MajorResponse>> updateMajor(
            @PathVariable Long id, @Valid @RequestBody MajorRequest request, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        MajorResponse response = academicService.updateMajor(id, request, user);
        return ResponseEntity.ok(ApiResponse.success(response, "Major updated successfully"));
    }

    @DeleteMapping("/majors/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete major", description = "Admin deletes a major")
    public ResponseEntity<ApiResponse<Void>> deleteMajor(@PathVariable Long id, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        academicService.deleteMajor(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Major deleted successfully"));
    }

    // -----------------------------------------------------------------
    // Cohorts
    // -----------------------------------------------------------------
    @GetMapping("/cohorts")
    @Operation(summary = "Get all cohorts", description = "Retrieve list of all academic cohorts/intakes")
    public ResponseEntity<ApiResponse<List<CohortResponse>>> getAllCohorts() {
        List<CohortResponse> cohorts = academicService.getAllCohorts();
        return ResponseEntity.ok(ApiResponse.success(cohorts, "Cohorts retrieved successfully"));
    }

    @PostMapping("/cohorts")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Create cohort", description = "Admin / Principal creates a new student cohort/intake")
    public ResponseEntity<ApiResponse<CohortResponse>> createCohort(
            @Valid @RequestBody CohortRequest request, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        CohortResponse response = academicService.createCohort(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response, "Cohort created successfully"));
    }

    @PutMapping("/cohorts/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Update cohort", description = "Admin / Principal updates cohort info")
    public ResponseEntity<ApiResponse<CohortResponse>> updateCohort(
            @PathVariable Long id, @Valid @RequestBody CohortRequest request, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        CohortResponse response = academicService.updateCohort(id, request, user);
        return ResponseEntity.ok(ApiResponse.success(response, "Cohort updated successfully"));
    }

    @DeleteMapping("/cohorts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete cohort", description = "Admin deletes a cohort")
    public ResponseEntity<ApiResponse<Void>> deleteCohort(@PathVariable Long id, Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "ADMIN";
        academicService.deleteCohort(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Cohort deleted successfully"));
    }
}
