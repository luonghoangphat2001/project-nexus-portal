package com.nexus.portal.repository;
import com.nexus.portal.model.DefenseAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
public interface DefenseAssignmentRepository extends JpaRepository<DefenseAssignment, Long> {
    List<DefenseAssignment> findByCouncilId(Long councilId);
    Optional<DefenseAssignment> findByRegistrationId(Long registrationId);
    @Query("select a.council.id from DefenseAssignment a where a.id = :id")
    Optional<Long> findCouncilIdById(Long id);
}
