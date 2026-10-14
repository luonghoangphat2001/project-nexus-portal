package com.nexus.portal.service;

import com.nexus.portal.dto.response.ResultResponse;
import java.util.List;

public interface ResultPublicationService {
    List<ResultResponse.Defense> publishAssignmentResults(Long assignmentId, String identifier);
    List<ResultResponse.Defense> getMyPublishedResults(String identifier);
}
