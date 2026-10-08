package com.nexus.portal.dto.request;
import jakarta.validation.constraints.*;
public record ProgressFeedbackRequest(@NotBlank @Size(max = 10000) String feedback) { }
