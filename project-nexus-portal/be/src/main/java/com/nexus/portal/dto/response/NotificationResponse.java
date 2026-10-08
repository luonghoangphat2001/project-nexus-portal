package com.nexus.portal.dto.response;
import java.time.LocalDateTime;
public record NotificationResponse(Long id, String title, String content, Long facultyId,
        String authorName, LocalDateTime createdAt, boolean read) { }
