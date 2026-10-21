package com.nexus.portal.dto.response;

import com.nexus.portal.enums.ProgressStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ProgressTaskResponse(Long id, Long teamId, String title, String description, LocalDate dueDate,
        Long assigneeId, String assigneeName, ProgressStatus status, String feedback, boolean overdue,
        List<TaskLogItem> logs) {

    public ProgressTaskResponse(Long id, Long teamId, String title, String description, LocalDate dueDate,
            Long assigneeId, String assigneeName, ProgressStatus status, String feedback, boolean overdue) {
        this(id, teamId, title, description, dueDate, assigneeId, assigneeName, status, feedback, overdue, List.of());
    }

    public record TaskLogItem(String username, String action, String details, LocalDateTime createdAt) {}
}

