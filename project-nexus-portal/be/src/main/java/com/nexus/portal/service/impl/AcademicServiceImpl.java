package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.CohortRequest;
import com.nexus.portal.dto.request.DepartmentRequest;
import com.nexus.portal.dto.request.FacultyRequest;
import com.nexus.portal.dto.request.MajorRequest;
import com.nexus.portal.dto.response.CohortResponse;
import com.nexus.portal.dto.response.DepartmentResponse;
import com.nexus.portal.dto.response.FacultyResponse;
import com.nexus.portal.dto.response.MajorResponse;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.Cohort;
import com.nexus.portal.model.Department;
import com.nexus.portal.model.Faculty;
import com.nexus.portal.model.Major;
import com.nexus.portal.repository.CohortRepository;
import com.nexus.portal.repository.DepartmentRepository;
import com.nexus.portal.repository.FacultyRepository;
import com.nexus.portal.repository.MajorRepository;
import com.nexus.portal.service.AcademicService;
import com.nexus.portal.service.AuditLogService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AcademicServiceImpl implements AcademicService {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final MajorRepository majorRepository;
    private final CohortRepository cohortRepository;
    private final AuditLogService auditLogService;

    public AcademicServiceImpl(FacultyRepository facultyRepository,
                               DepartmentRepository departmentRepository,
                               MajorRepository majorRepository,
                               CohortRepository cohortRepository,
                               AuditLogService auditLogService) {
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.majorRepository = majorRepository;
        this.cohortRepository = cohortRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyResponse> getAllFaculties() {
        return facultyRepository.findAll().stream()
                .map(f -> new FacultyResponse(f.getId(), f.getCode(), f.getName()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(d -> new DepartmentResponse(d.getId(), d.getFaculty().getId(), d.getCode(), d.getName()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getDepartmentsByFaculty(Long facultyId) {
        if (facultyId != null) {
            return departmentRepository.findByFacultyId(facultyId).stream()
                    .map(d -> new DepartmentResponse(d.getId(), d.getFaculty().getId(), d.getCode(), d.getName()))
                    .collect(Collectors.toList());
        }
        return getAllDepartments();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MajorResponse> getAllMajors() {
        return majorRepository.findAll().stream()
                .map(m -> new MajorResponse(m.getId(), m.getDepartment().getId(), m.getCode(), m.getName()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MajorResponse> getMajorsByDepartment(Long departmentId) {
        if (departmentId != null) {
            return majorRepository.findByDepartmentId(departmentId).stream()
                    .map(m -> new MajorResponse(m.getId(), m.getDepartment().getId(), m.getCode(), m.getName()))
                    .collect(Collectors.toList());
        }
        return getAllMajors();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CohortResponse> getAllCohorts() {
        return cohortRepository.findAll().stream()
                .map(c -> new CohortResponse(c.getId(), c.getCode(), c.getName(), c.getAdmissionYear(), c.getGraduationYear()))
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------
    // Faculty CRUD
    // ----------------------------------------------------
    @Override
    @Transactional
    public FacultyResponse createFaculty(FacultyRequest request, String performedBy) {
        Faculty faculty = Faculty.builder()
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .build();
        Faculty saved = facultyRepository.save(faculty);

        auditLogService.log(null, performedBy, "CREATE_FACULTY", "Faculty",
                "Created faculty: " + saved.getName() + " (" + saved.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return new FacultyResponse(saved.getId(), saved.getCode(), saved.getName());
    }

    @Override
    @Transactional
    public FacultyResponse updateFaculty(Long id, FacultyRequest request, String performedBy) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with ID: " + id));

        faculty.setCode(request.getCode().trim());
        faculty.setName(request.getName().trim());
        Faculty saved = facultyRepository.save(faculty);

        auditLogService.log(null, performedBy, "UPDATE_FACULTY", "Faculty",
                "Updated faculty ID " + id + ": " + saved.getName() + " (" + saved.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return new FacultyResponse(saved.getId(), saved.getCode(), saved.getName());
    }

    @Override
    @Transactional
    public void deleteFaculty(Long id, String performedBy) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with ID: " + id));

        if (!departmentRepository.findByFacultyId(id).isEmpty()) {
            throw new BadRequestException("Cannot delete faculty that currently contains departments!");
        }

        facultyRepository.delete(faculty);
        auditLogService.log(null, performedBy, "DELETE_FACULTY", "Faculty",
                "Deleted faculty: " + faculty.getName() + " (" + faculty.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");
    }

    // ----------------------------------------------------
    // Department CRUD
    // ----------------------------------------------------
    @Override
    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request, String performedBy) {
        Faculty faculty = facultyRepository.findById(request.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with ID: " + request.getFacultyId()));

        Department department = Department.builder()
                .faculty(faculty)
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .build();
        Department saved = departmentRepository.save(department);

        auditLogService.log(null, performedBy, "CREATE_DEPARTMENT", "Department",
                "Created department: " + saved.getName() + " (" + saved.getCode() + ") under faculty " + faculty.getName(), "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return new DepartmentResponse(saved.getId(), faculty.getId(), saved.getCode(), saved.getName());
    }

    @Override
    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request, String performedBy) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        Faculty faculty = facultyRepository.findById(request.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with ID: " + request.getFacultyId()));

        department.setFaculty(faculty);
        department.setCode(request.getCode().trim());
        department.setName(request.getName().trim());
        Department saved = departmentRepository.save(department);

        auditLogService.log(null, performedBy, "UPDATE_DEPARTMENT", "Department",
                "Updated department ID " + id + ": " + saved.getName() + " (" + saved.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return new DepartmentResponse(saved.getId(), faculty.getId(), saved.getCode(), saved.getName());
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id, String performedBy) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        if (!majorRepository.findByDepartmentId(id).isEmpty()) {
            throw new BadRequestException("Cannot delete department that currently contains majors!");
        }

        departmentRepository.delete(department);
        auditLogService.log(null, performedBy, "DELETE_DEPARTMENT", "Department",
                "Deleted department: " + department.getName() + " (" + department.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");
    }

    // ----------------------------------------------------
    // Major CRUD
    // ----------------------------------------------------
    @Override
    @Transactional
    public MajorResponse createMajor(MajorRequest request, String performedBy) {
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + request.getDepartmentId()));

        Major major = Major.builder()
                .department(department)
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .build();
        Major saved = majorRepository.save(major);

        auditLogService.log(null, performedBy, "CREATE_MAJOR", "Major",
                "Created major: " + saved.getName() + " (" + saved.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return new MajorResponse(saved.getId(), department.getId(), saved.getCode(), saved.getName());
    }

    @Override
    @Transactional
    public MajorResponse updateMajor(Long id, MajorRequest request, String performedBy) {
        Major major = majorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Major not found with ID: " + id));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + request.getDepartmentId()));

        major.setDepartment(department);
        major.setCode(request.getCode().trim());
        major.setName(request.getName().trim());
        Major saved = majorRepository.save(major);

        auditLogService.log(null, performedBy, "UPDATE_MAJOR", "Major",
                "Updated major ID " + id + ": " + saved.getName() + " (" + saved.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return new MajorResponse(saved.getId(), department.getId(), saved.getCode(), saved.getName());
    }

    @Override
    @Transactional
    public void deleteMajor(Long id, String performedBy) {
        Major major = majorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Major not found with ID: " + id));

        majorRepository.delete(major);
        auditLogService.log(null, performedBy, "DELETE_MAJOR", "Major",
                "Deleted major: " + major.getName() + " (" + major.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");
    }

    // ----------------------------------------------------
    // Cohort CRUD
    // ----------------------------------------------------
    @Override
    @Transactional
    public CohortResponse createCohort(CohortRequest request, String performedBy) {
        Cohort cohort = Cohort.builder()
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .admissionYear(request.getAdmissionYear())
                .graduationYear(request.getGraduationYear())
                .build();
        Cohort saved = cohortRepository.save(cohort);

        auditLogService.log(null, performedBy, "CREATE_COHORT", "Cohort",
                "Created cohort: " + saved.getName() + " (" + saved.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return new CohortResponse(saved.getId(), saved.getCode(), saved.getName(), saved.getAdmissionYear(), saved.getGraduationYear());
    }

    @Override
    @Transactional
    public CohortResponse updateCohort(Long id, CohortRequest request, String performedBy) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cohort not found with ID: " + id));

        cohort.setCode(request.getCode().trim());
        cohort.setName(request.getName().trim());
        cohort.setAdmissionYear(request.getAdmissionYear());
        cohort.setGraduationYear(request.getGraduationYear());
        Cohort saved = cohortRepository.save(cohort);

        auditLogService.log(null, performedBy, "UPDATE_COHORT", "Cohort",
                "Updated cohort ID " + id + ": " + saved.getName() + " (" + saved.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return new CohortResponse(saved.getId(), saved.getCode(), saved.getName(), saved.getAdmissionYear(), saved.getGraduationYear());
    }

    @Override
    @Transactional
    public void deleteCohort(Long id, String performedBy) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cohort not found with ID: " + id));

        cohortRepository.delete(cohort);
        auditLogService.log(null, performedBy, "DELETE_COHORT", "Cohort",
                "Deleted cohort: " + cohort.getName() + " (" + cohort.getCode() + ")", "127.0.0.1", "NexusPortal/Admin", "SUCCESS");
    }
}
