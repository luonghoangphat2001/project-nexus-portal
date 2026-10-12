package com.nexus.portal.service;

import com.nexus.portal.dto.response.AcademicReportOptionsResponse;
import com.nexus.portal.dto.response.AcademicReportRowResponse;

import java.util.List;

public interface AcademicReportService {
    AcademicReportOptionsResponse getReportOptions(String identifier);

    List<AcademicReportRowResponse> getAcademicReport(
            Long periodId, Long departmentId, Long topicId, String identifier);
}
