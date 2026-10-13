package com.nexus.portal.repository;

import com.nexus.portal.model.PublishedResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PublishedResultRepository extends JpaRepository<PublishedResult, Long>, PublishedResultReadRepository {
    List<PublishedResult> findByStudentIdAndPublishedAtIsNotNullOrderByPublishedAtDesc(Long studentId);
}
