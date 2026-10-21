package com.nexus.portal.service;

import com.nexus.portal.dto.request.NotificationRequest;
import com.nexus.portal.dto.response.NotificationResponse;
import com.nexus.portal.model.Faculty;
import com.nexus.portal.model.User;
import com.nexus.portal.security.UserPrincipal;

import java.util.Collection;
import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getAll(UserPrincipal actor);
    NotificationResponse create(NotificationRequest request, UserPrincipal actor);
    void sendNotification(User recipient, User author, String title, String content);
    void sendNotification(User recipient, User author, String title, String content, Faculty faculty);
    void sendNotificationToUsers(Collection<User> recipients, User author, String title, String content);
    void markRead(Long id, UserPrincipal actor);
    void delete(Long id);
    void delete(Long id, UserPrincipal actor);
}
