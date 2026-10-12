package com.nexus.portal.dto.response;
import com.nexus.portal.enums.ProgressStatus;
import java.time.LocalDate;
public record ProgressTaskResponse(Long id, Long teamId, String title, String description, LocalDate dueDate,
        Long assigneeId, String assigneeName, ProgressStatus status, String feedback, boolean overdue) { }
