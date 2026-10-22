package com.nexus.portal.repository;

import com.nexus.portal.model.EmailLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {

    @Query("SELECT e FROM EmailLog e WHERE " +
           "(:query IS NULL OR LOWER(e.recipient) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(e.subject) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(COALESCE(e.recipientName, '')) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:status IS NULL OR e.status = :status)")
    Page<EmailLog> findWithFilters(@Param("query") String query,
                                   @Param("status") String status,
                                   Pageable pageable);

    long countByStatus(String status);
}

