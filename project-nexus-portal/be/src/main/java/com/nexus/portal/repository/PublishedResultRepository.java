package com.nexus.portal.repository;

import com.nexus.portal.model.PublishedResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PublishedResultRepository extends JpaRepository<PublishedResult, Long> {
    boolean existsByAssignmentId(Long assignmentId);
    List<PublishedResult> findByAssignmentIdOrderByStudentIdAsc(Long assignmentId);
    List<PublishedResult> findByStudentIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(Long studentId);
}
