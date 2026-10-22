package com.nexus.portal.service;

import com.nexus.portal.dto.request.GradeAppealRequest;
import com.nexus.portal.dto.request.GradeAppealStatusRequest;
import com.nexus.portal.dto.response.GradeAppealResponse;

import java.util.List;

public interface GradeAppealService {
    GradeAppealResponse submitAppeal(Long assignmentId, GradeAppealRequest request, String identifier);
    List<GradeAppealResponse> getMyAppeals(String identifier);
    List<GradeAppealResponse> getAppeals(Long assignmentId, String identifier);
    GradeAppealResponse updateAppealStatus(Long id, GradeAppealStatusRequest request, String identifier);
}

