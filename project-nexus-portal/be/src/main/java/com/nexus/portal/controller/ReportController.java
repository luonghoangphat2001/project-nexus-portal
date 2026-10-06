package com.nexus.portal.controller;

import com.nexus.portal.dto.request.ReportUploadRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.service.ReportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/reports")
@Tag(name = "Module 11 - Reports & Documents")
public class ReportController {
    private final ReportService reports;
    public ReportController(ReportService reports) { this.reports = reports; }

    @GetMapping("/registrations")
    public ResponseEntity<ApiResponse<List<DefenseRegistrationResponse>>> getRegistrations(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(reports.getRegistrations(auth.getName())));
    }

    @GetMapping("/registrations/{id}/documents")
    public ResponseEntity<ApiResponse<List<ReportDocumentResponse>>> getDocuments(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(reports.getDocuments(id, auth.getName())));
    }

    @PostMapping(value = "/registrations/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ReportDocumentResponse>> uploadDocument(@PathVariable Long id,
            @Valid @ModelAttribute ReportUploadRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(
                reports.uploadDocument(id, request, auth.getName()), "Document submitted successfully"));
    }

    @GetMapping("/documents/{id}/content")
    public ResponseEntity<ApiResponse<DocumentContentResponse>> downloadDocument(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(reports.downloadDocument(id, auth.getName())));
    }
}
