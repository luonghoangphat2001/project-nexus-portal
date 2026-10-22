package com.nexus.portal.repository;
import com.nexus.portal.model.Assessment;
import com.nexus.portal.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.Set;
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(Long assignmentId);
    Optional<Assessment> findByAssignmentIdAndEvaluatorIdAndStudentIdAndType(Long assignmentId, Long evaluatorId, Long studentId, AssessmentType type);
    boolean existsByAssignmentCouncilId(Long councilId);
    boolean existsByAssignmentId(Long assignmentId);
    boolean existsByAssignmentCouncilIdAndStatus(Long councilId, AssessmentStatus status);
    boolean existsByAssignmentRegistrationIdAndStatus(Long registrationId, AssessmentStatus status);
    @Query("select distinct a.assignment.id from Assessment a where a.assignment.id in :assignmentIds")
    Set<Long> findAssignmentIdsWithAssessments(List<Long> assignmentIds);
    @Query("select distinct a.assignment.id from Assessment a where a.assignment.id in :assignmentIds and a.status = :status")
    Set<Long> findAssignmentIdsWithAssessmentsAndStatus(@Param("assignmentIds") List<Long> assignmentIds,
                                                         @Param("status") AssessmentStatus status);
    @Query("select a.assignment.council.id from Assessment a where a.id = :id")
    Optional<Long> findCouncilIdById(Long id);
}
