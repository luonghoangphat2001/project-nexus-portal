package com.nexus.portal.dto.request;

import com.nexus.portal.enums.DocumentType;
import jakarta.validation.constraints.*;
import org.springframework.web.multipart.MultipartFile;

public record ReportUploadRequest(
        @NotNull DocumentType type,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String note,
        @NotNull MultipartFile file) {}
