package com.nexus.portal.service;

import com.nexus.portal.dto.response.DefenseResultResponse;
import java.util.List;

public interface ResultPublicationService {
    List<DefenseResultResponse> publishAssignmentResults(Long assignmentId, String identifier);
    List<DefenseResultResponse> getMyPublishedResults(String identifier);
}
