package com.nexus.portal.dto.request;
import com.nexus.portal.enums.CouncilStatus;
import jakarta.validation.constraints.NotNull;
public record CouncilStatusRequest(@NotNull CouncilStatus status) {}
