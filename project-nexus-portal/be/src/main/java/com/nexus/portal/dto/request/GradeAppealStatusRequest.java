package com.nexus.portal.dto.request;

import com.nexus.portal.enums.AppealStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GradeAppealStatusRequest(
        @NotNull(message = "Trạng thái không được để trống")
        AppealStatus status,
        @Size(max = 2000, message = "Ghi chú không quá 2000 ký tự")
        String responseNote
) {}

