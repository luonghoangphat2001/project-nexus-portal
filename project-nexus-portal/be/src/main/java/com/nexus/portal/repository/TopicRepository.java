package com.nexus.portal.repository;

import com.nexus.portal.enums.TopicStatus;
import com.nexus.portal.model.Topic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long>, JpaSpecificationExecutor<Topic> {
    boolean existsByPeriodId(Long periodId);

    @Query("SELECT DISTINCT t FROM Topic t " +
           "JOIN t.topicLecturers tl " +
           "WHERE tl.lecturer.id = :lecturerId")
    List<Topic> findByLecturerId(@Param("lecturerId") Long lecturerId);

    List<Topic> findByDepartmentId(Long departmentId);

    List<Topic> findByDepartmentIdIn(java.util.Collection<Long> departmentIds);

    @Query("SELECT DISTINCT t FROM Topic t " +
           "LEFT JOIN t.majors m " +
           "LEFT JOIN t.topicLecturers tl " +
           "WHERE (:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:departmentId IS NULL OR t.department.id = :departmentId) " +
           "AND (:majorId IS NULL OR m.id = :majorId) " +
           "AND (:lecturerId IS NULL OR tl.lecturer.id = :lecturerId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:periodId IS NULL OR t.period.id = :periodId)")
    Page<Topic> searchTopics(
            @Param("keyword") String keyword,
            @Param("departmentId") Long departmentId,
            @Param("majorId") Long majorId,
            @Param("lecturerId") Long lecturerId,
            @Param("status") TopicStatus status,
            @Param("periodId") Long periodId,
            Pageable pageable
    );
}
