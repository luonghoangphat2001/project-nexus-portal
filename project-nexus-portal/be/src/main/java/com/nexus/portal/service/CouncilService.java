package com.nexus.portal.service;

import com.nexus.portal.dto.request.*;
import com.nexus.portal.dto.response.*;
import java.util.List;

public interface CouncilService {
    List<CouncilResponse> getCouncils(String identifier);
    CouncilOptionsResponse getOptions(String identifier);
    CouncilResponse createCouncil(CouncilRequest request, String identifier);
    CouncilResponse updateCouncil(Long id, CouncilRequest request, String identifier);
    CouncilResponse changeStatus(Long id, CouncilStatusRequest request, String identifier);
    CouncilResponse assignRegistration(Long id, DefenseAssignmentRequest request, String identifier);
    void removeAssignment(Long councilId, Long assignmentId, String identifier);
}
