package com.nexus.portal.repository;

import com.nexus.portal.model.FinalResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FinalResultRepository extends JpaRepository<FinalResult, Long> {
    boolean existsByAssignmentId(Long assignmentId);
    List<FinalResult> findByAssignmentIdOrderByStudentIdAsc(Long assignmentId);
    List<FinalResult> findByStudentIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(Long studentId);
}
