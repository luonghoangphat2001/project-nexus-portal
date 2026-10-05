package com.nexus.portal.repository;

import com.nexus.portal.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    // Serialize schedule changes, including room conflicts across departments.
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select d from Department d order by d.id")
    List<Department> lockScheduleDepartments();
    List<Department> findByFacultyId(Long facultyId);
    Optional<Department> findByCode(String code);
}
