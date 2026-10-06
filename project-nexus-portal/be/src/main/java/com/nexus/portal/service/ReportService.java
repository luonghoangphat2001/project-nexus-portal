package com.nexus.portal.service;

import com.nexus.portal.dto.request.ReportUploadRequest;
import com.nexus.portal.dto.response.*;
import java.util.List;

public interface ReportService {
    List<DefenseRegistrationResponse> getRegistrations(String identifier);
    List<ReportDocumentResponse> getDocuments(Long registrationId, String identifier);
    ReportDocumentResponse uploadDocument(Long registrationId, ReportUploadRequest request, String identifier);
    DocumentContentResponse downloadDocument(Long documentId, String identifier);
}
