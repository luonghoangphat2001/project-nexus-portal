package com.nexus.portal.repository;

import com.nexus.portal.enums.AppealStatus;
import com.nexus.portal.model.GradeAppeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GradeAppealRepository extends JpaRepository<GradeAppeal, Long> {

    List<GradeAppeal> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<GradeAppeal> findByAssignmentIdOrderByCreatedAtDesc(Long assignmentId);

    Optional<GradeAppeal> findFirstByAssignmentIdAndStudentIdOrderByCreatedAtDesc(Long assignmentId, Long studentId);

    boolean existsByAssignmentIdAndStudentIdAndStatus(Long assignmentId, Long studentId, AppealStatus status);

    @Query("SELECT a FROM GradeAppeal a " +
           "JOIN a.assignment da " +
           "JOIN da.council c " +
           "WHERE (:departmentId IS NULL OR c.department.id = :departmentId) " +
           "ORDER BY a.createdAt DESC")
    List<GradeAppeal> findByDepartmentId(@Param("departmentId") Long departmentId);

    @Query("SELECT a FROM GradeAppeal a " +
           "JOIN a.assignment da " +
           "JOIN da.council c " +
           "JOIN c.members m " +
           "WHERE m.lecturer.id = :lecturerId " +
           "ORDER BY a.createdAt DESC")
    List<GradeAppeal> findByCouncilMemberId(@Param("lecturerId") Long lecturerId);
}

