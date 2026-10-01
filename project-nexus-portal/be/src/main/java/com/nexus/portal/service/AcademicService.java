package com.nexus.portal.service;

import com.nexus.portal.dto.request.CohortRequest;
import com.nexus.portal.dto.request.DepartmentRequest;
import com.nexus.portal.dto.request.FacultyRequest;
import com.nexus.portal.dto.request.MajorRequest;
import com.nexus.portal.dto.response.CohortResponse;
import com.nexus.portal.dto.response.DepartmentResponse;
import com.nexus.portal.dto.response.FacultyResponse;
import com.nexus.portal.dto.response.MajorResponse;

import java.util.List;

public interface AcademicService {
    List<FacultyResponse> getAllFaculties();
    List<DepartmentResponse> getAllDepartments();
    List<DepartmentResponse> getDepartmentsByFaculty(Long facultyId);
    List<MajorResponse> getAllMajors();
    List<MajorResponse> getMajorsByDepartment(Long departmentId);
    List<CohortResponse> getAllCohorts();

    // Faculty CRUD
    FacultyResponse createFaculty(FacultyRequest request, String performedBy);
    FacultyResponse updateFaculty(Long id, FacultyRequest request, String performedBy);
    void deleteFaculty(Long id, String performedBy);

    // Department CRUD
    DepartmentResponse createDepartment(DepartmentRequest request, String performedBy);
    DepartmentResponse updateDepartment(Long id, DepartmentRequest request, String performedBy);
    void deleteDepartment(Long id, String performedBy);

    // Major CRUD
    MajorResponse createMajor(MajorRequest request, String performedBy);
    MajorResponse updateMajor(Long id, MajorRequest request, String performedBy);
    void deleteMajor(Long id, String performedBy);

    // Cohort CRUD
    CohortResponse createCohort(CohortRequest request, String performedBy);
    CohortResponse updateCohort(Long id, CohortRequest request, String performedBy);
    void deleteCohort(Long id, String performedBy);
}
