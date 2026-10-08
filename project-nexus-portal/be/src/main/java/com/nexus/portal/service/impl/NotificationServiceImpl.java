package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.NotificationRequest;
import com.nexus.portal.dto.response.NotificationResponse;
import com.nexus.portal.exception.*;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.security.UserPrincipal;
import com.nexus.portal.service.NotificationService;
import com.nexus.portal.service.NotificationDelivery;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notifications;
    private final NotificationReadRepository reads;
    private final UserRepository users;
    private final FacultyRepository faculties;
    private final List<NotificationDelivery> deliveries;
    public NotificationServiceImpl(NotificationRepository notifications, NotificationReadRepository reads,
            UserRepository users, FacultyRepository faculties, List<NotificationDelivery> deliveries) {
        this.notifications = notifications;
        this.reads = reads;
        this.users = users;
        this.faculties = faculties;
        this.deliveries = deliveries;
    }
    @Transactional(readOnly = true)
    public List<NotificationResponse> getAll(UserPrincipal actor) {
        User user = users.findById(actor.getId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notifications.findAll(org.springframework.data.domain.Sort.by("createdAt").descending()).stream()
                .filter(notification -> visible(notification, user, actor)).map(notification -> response(notification, actor)).toList();
    }
    public NotificationResponse create(NotificationRequest request, UserPrincipal actor) {
        Notification notification = new Notification();
        notification.setTitle(request.title().trim());
        notification.setContent(request.content().trim());
        notification.setAuthor(users.findById(actor.getId()).orElseThrow(() -> new ResourceNotFoundException("User not found")));
        if (request.facultyId() != null) {
            notification.setFaculty(faculties.findById(request.facultyId()).orElseThrow(() -> new ResourceNotFoundException("Faculty not found")));
        }
        NotificationResponse result = response(notifications.save(notification), actor);
        notifyAfterCommit(null);
        return result;
    }
    public void markRead(Long id, UserPrincipal actor) {
        Notification notification = find(id);
        User user = users.findById(actor.getId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!visible(notification, user, actor)) throw new AppException("Notification access denied", HttpStatus.FORBIDDEN);
        if (!reads.existsByNotificationIdAndUserId(id, actor.getId())) reads.save(new NotificationRead(notification, user));
        notifyAfterCommit(actor.getId());
    }
    public void delete(Long id) {
        Notification notification = find(id);
        reads.deleteByNotificationId(id);
        notifications.delete(notification);
        notifyAfterCommit(null);
    }
    private void notifyAfterCommit(Long userId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                deliveries.forEach(delivery -> delivery.changed(userId));
            }
        });
    }
    private Notification find(Long id) {
        return notifications.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
    }
    private boolean visible(Notification notification, User user, UserPrincipal actor) {
        return notification.getFaculty() == null || actor.getAuthorities().stream().anyMatch(authority ->
                authority.getAuthority().equals("ROLE_ADMIN") || authority.getAuthority().equals("ROLE_PRINCIPAL"))
                || user.getFaculties().stream().anyMatch(faculty -> faculty.getId().equals(notification.getFaculty().getId()));
    }
    private NotificationResponse response(Notification notification, UserPrincipal actor) {
        return new NotificationResponse(notification.getId(), notification.getTitle(), notification.getContent(),
                notification.getFaculty() == null ? null : notification.getFaculty().getId(), notification.getAuthor().getFullName(),
                notification.getCreatedAt(), reads.existsByNotificationIdAndUserId(notification.getId(), actor.getId()));
    }
}
