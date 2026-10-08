package com.nexus.portal.dto.request;
import com.nexus.portal.enums.ProgressStatus;
import jakarta.validation.constraints.NotNull;
public record ProgressStatusRequest(@NotNull ProgressStatus status) { }
