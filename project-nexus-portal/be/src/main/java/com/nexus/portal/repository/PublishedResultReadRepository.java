package com.nexus.portal.repository;

import com.nexus.portal.model.PublishedResult;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.Repository;

import java.util.List;

@NoRepositoryBean
public interface PublishedResultReadRepository extends Repository<PublishedResult, Long> {
    boolean existsByAssignmentId(Long assignmentId);
    List<PublishedResult> findByAssignmentIdOrderByStudentIdAsc(Long assignmentId);
}
