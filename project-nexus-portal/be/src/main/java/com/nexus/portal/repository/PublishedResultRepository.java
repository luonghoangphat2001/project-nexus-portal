package com.nexus.portal.repository;

import com.nexus.portal.model.PublishedResult;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface PublishedResultRepository extends JpaRepository<PublishedResult, Long> {
    boolean existsByAssignmentId(Long assignmentId);
    List<PublishedResult> findByAssignmentIdOrderByStudentIdAsc(Long assignmentId);
    List<PublishedResult> findByStudentIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(Long studentId);

    @EntityGraph(attributePaths = {
            "assignment.registration.topic",
            "assignment.registration.topic.department",
            "assignment.registration.topic.period"
    })
    @Query("""
            select result from PublishedResult result
            join result.assignment assignment
            join assignment.registration registration
            join registration.topic topic
            where result.publishedAt is not null
              and topic.department.id in :departmentIds
              and (:periodId is null or topic.period.id = :periodId)
              and (:departmentId is null or topic.department.id = :departmentId)
              and (:topicId is null or topic.id = :topicId)
            """)
    List<PublishedResult> findPublishedForReport(
            @Param("departmentIds") Set<Long> departmentIds,
            @Param("periodId") Long periodId,
            @Param("departmentId") Long departmentId,
            @Param("topicId") Long topicId);
}
