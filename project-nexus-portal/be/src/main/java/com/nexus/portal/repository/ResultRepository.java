package com.nexus.portal.repository;

import com.nexus.portal.model.Result;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Collection;
import java.util.Set;
import java.util.Set;

public interface ResultRepository extends JpaRepository<Result, Long> {
    boolean existsByAssignmentId(Long assignmentId);
    @Query("select distinct result.assignment.id from Result result where result.assignment.id in :assignmentIds")
    Set<Long> findPublishedAssignmentIdsByAssignmentIdIn(@Param("assignmentIds") Collection<Long> assignmentIds);
    List<Result> findByAssignmentIdOrderByStudentIdAsc(Long assignmentId);
    List<Result> findByStudentIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(Long studentId);

    @EntityGraph(attributePaths = {
            "assignment.registration.topic",
            "assignment.registration.topic.department",
            "assignment.registration.topic.period"
    })
    @Query("""
            select result from Result result
            join result.assignment assignment
            join assignment.registration registration
            join registration.topic topic
            where result.publishedAt is not null
              and topic.department.id in :departmentIds
              and (:periodId is null or topic.period.id = :periodId)
              and (:departmentId is null or topic.department.id = :departmentId)
              and (:topicId is null or topic.id = :topicId)
            """)
    List<Result> findPublishedForReport(
            @Param("departmentIds") Set<Long> departmentIds,
            @Param("periodId") Long periodId,
            @Param("departmentId") Long departmentId,
            @Param("topicId") Long topicId);
}
