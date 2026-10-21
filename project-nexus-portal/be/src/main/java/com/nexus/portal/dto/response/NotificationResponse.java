package com.nexus.portal.dto.response;

import java.time.LocalDateTime;

public record NotificationResponse(Long id, String title, String content, Long facultyId,
        String authorName, LocalDateTime createdAt, boolean read, Long recipientId) {

    public NotificationResponse(Long id, String title, String content, Long facultyId,
            String authorName, LocalDateTime createdAt, boolean read) {
        this(id, title, content, facultyId, authorName, createdAt, read, null);
    }
}
