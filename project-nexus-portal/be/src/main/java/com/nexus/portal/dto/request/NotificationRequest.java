package com.nexus.portal.dto.request;
import jakarta.validation.constraints.*;
public record NotificationRequest(@NotBlank @Size(max = 150) String title,
        @NotBlank @Size(max = 10000) String content, @Positive Long facultyId) { }
