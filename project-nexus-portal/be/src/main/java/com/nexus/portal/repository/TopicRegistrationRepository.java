package com.nexus.portal.repository;

import com.nexus.portal.enums.RegistrationStatus;
import com.nexus.portal.model.TopicRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TopicRegistrationRepository extends JpaRepository<TopicRegistration, Long> {

    List<TopicRegistration> findByStatus(RegistrationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from TopicRegistration r where r.id = :id")
    Optional<TopicRegistration> findLockedById(Long id);

    List<TopicRegistration> findByTopicId(Long topicId);

    List<TopicRegistration> findByTeamId(Long teamId);

    Optional<TopicRegistration> findByTopicIdAndTeamId(Long topicId, Long teamId);

    boolean existsByTeamIdAndStatus(Long teamId, RegistrationStatus status);

    boolean existsByTopicIdAndStatus(Long topicId, RegistrationStatus status);
}
