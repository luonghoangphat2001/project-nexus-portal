package com.nexus.portal.repository;
import com.nexus.portal.model.DefenseAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
public interface DefenseAssignmentRepository extends JpaRepository<DefenseAssignment, Long> {
    List<DefenseAssignment> findByCouncilId(Long councilId);

    @Query("""
            select distinct a from DefenseAssignment a
            join a.council c
            join c.members member
            where member.lecturer.id = :lecturerId
            """)
    List<DefenseAssignment> findByCouncilMemberLecturerId(
            @org.springframework.data.repository.query.Param("lecturerId") Long lecturerId);

    Optional<DefenseAssignment> findByRegistrationId(Long registrationId);
    @Query("""
            select a from DefenseAssignment a
            where a.registration.topic.period.id = :periodId
              and a.council.status = com.nexus.portal.enums.CouncilStatus.COMPLETED
              and not exists (select r.id from Result r where r.assignment = a)
            order by a.id
            """)
    List<DefenseAssignment> findUnpublishedCompletedByPeriodId(Long periodId);

    @Query("select a.council.id from DefenseAssignment a where a.id = :id")
    Optional<Long> findCouncilIdById(Long id);
}
