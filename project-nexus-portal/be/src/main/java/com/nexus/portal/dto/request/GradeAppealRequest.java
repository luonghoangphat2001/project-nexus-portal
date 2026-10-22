package com.nexus.portal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GradeAppealRequest(
        @NotBlank(message = "Lý do phúc khảo không được để trống")
        @Size(max = 2000, message = "Lý do phúc khảo không quá 2000 ký tự")
        String reason
) {}

