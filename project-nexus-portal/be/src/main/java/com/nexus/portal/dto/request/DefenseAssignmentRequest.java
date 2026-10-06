package com.nexus.portal.dto.request;
import jakarta.validation.constraints.*;
public record DefenseAssignmentRequest(@NotNull @Positive Long registrationId) {}
