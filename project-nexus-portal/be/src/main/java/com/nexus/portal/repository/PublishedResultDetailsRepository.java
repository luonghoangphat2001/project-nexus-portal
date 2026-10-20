package com.nexus.portal.repository;

import com.nexus.portal.model.PublishedResultDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PublishedResultDetailsRepository extends JpaRepository<PublishedResultDetails, Long> {
    List<PublishedResultDetails> findByIdIn(Collection<Long> ids);
}
