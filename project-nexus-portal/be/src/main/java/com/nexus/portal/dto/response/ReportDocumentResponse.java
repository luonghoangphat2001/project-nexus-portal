package com.nexus.portal.dto.response;
import com.nexus.portal.enums.DocumentType;
import java.time.LocalDateTime;
public record ReportDocumentResponse(Long id, Long registrationId, DocumentType type,
        String title, String note, String fileName, String contentType, Long fileSize,
        Integer version, String submittedByName, LocalDateTime submittedAt) {}
