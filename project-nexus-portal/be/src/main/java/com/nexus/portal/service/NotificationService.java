package com.nexus.portal.service;
import com.nexus.portal.dto.request.NotificationRequest;
import com.nexus.portal.dto.response.NotificationResponse;
import com.nexus.portal.security.UserPrincipal;
import java.util.List;
public interface NotificationService {
    List<NotificationResponse> getAll(UserPrincipal actor);
    NotificationResponse create(NotificationRequest request, UserPrincipal actor);
    void markRead(Long id, UserPrincipal actor);
    void delete(Long id);
}
