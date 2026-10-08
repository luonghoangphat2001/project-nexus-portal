package com.nexus.portal.dto.request;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
public record ProgressTaskRequest(@NotBlank @Size(max = 150) String title,
        @Size(max = 10000) String description, @NotNull LocalDate dueDate,
        @NotNull @Positive Long assigneeId) { }
