package com.nexus.portal.repository;
import com.nexus.portal.model.DefenseCouncil;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
public interface DefenseCouncilRepository extends JpaRepository<DefenseCouncil, Long> {
    List<DefenseCouncil> findAllByOrderByStartsAtDesc();
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from DefenseCouncil c where c.id = :id")
    Optional<DefenseCouncil> findLockedById(Long id);
}
