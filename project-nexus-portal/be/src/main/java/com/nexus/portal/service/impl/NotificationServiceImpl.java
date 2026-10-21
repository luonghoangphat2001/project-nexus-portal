package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.NotificationRequest;
import com.nexus.portal.dto.response.NotificationResponse;
import com.nexus.portal.exception.*;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.security.UserPrincipal;
import com.nexus.portal.service.NotificationService;
import com.nexus.portal.service.NotificationDelivery;
import com.nexus.portal.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notifications;
    private final NotificationReadRepository reads;
    private final UserRepository users;
    private final FacultyRepository faculties;
    private final List<NotificationDelivery> deliveries;
    private EmailService emailService;

    public NotificationServiceImpl(NotificationRepository notifications, NotificationReadRepository reads,
            UserRepository users, FacultyRepository faculties, List<NotificationDelivery> deliveries) {
        this.notifications = notifications;
        this.reads = reads;
        this.users = users;
        this.faculties = faculties;
        this.deliveries = deliveries;
    }

    @Autowired
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getAll(UserPrincipal actor) {
        User user = users.findById(actor.getId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notifications.findAll(org.springframework.data.domain.Sort.by("createdAt").descending()).stream()
                .filter(notification -> visible(notification, user, actor)).map(notification -> response(notification, actor)).toList();
    }

    @Override
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

    @Override
    public void sendNotification(User recipient, User author, String title, String content) {
        sendNotification(recipient, author, title, content, null);
    }

    @Override
    public void sendNotification(User recipient, User author, String title, String content, Faculty faculty) {
        if (recipient == null) return;
        User resolvedAuthor = author;
        if (resolvedAuthor == null) {
            resolvedAuthor = users.findByUsername("superadmin")
                    .or(() -> users.findById(1L))
                    .orElse(recipient);
        }

        Notification notification = new Notification();
        notification.setTitle(title.trim());
        notification.setContent(content.trim());
        notification.setAuthor(resolvedAuthor);
        notification.setRecipient(recipient);
        if (faculty != null) {
            notification.setFaculty(faculty);
        } else if (recipient.getFaculties() != null && !recipient.getFaculties().isEmpty()) {
            notification.setFaculty(recipient.getFaculties().iterator().next());
        }

        notifications.save(notification);
        notifyAfterCommit(recipient.getId());

        if (emailService != null && recipient.getEmail() != null && !recipient.getEmail().trim().isEmpty()) {
            try {
                emailService.sendNotificationEmail(recipient.getEmail(), title, content);
            } catch (Exception ignored) {
            }
        }
    }

    @Override
    public void sendNotificationToUsers(Collection<User> recipients, User author, String title, String content) {
        if (recipients == null || recipients.isEmpty()) return;
        for (User recipient : recipients) {
            if (recipient != null) {
                sendNotification(recipient, author, title, content, null);
            }
        }
    }

    @Override
    public void markRead(Long id, UserPrincipal actor) {
        Notification notification = find(id);
        User user = users.findById(actor.getId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!visible(notification, user, actor)) throw new AppException("Notification access denied", HttpStatus.FORBIDDEN);
        if (!reads.existsByNotificationIdAndUserId(id, actor.getId())) reads.save(new NotificationRead(notification, user));
        notifyAfterCommit(actor.getId());
    }

    @Override
    public void delete(Long id) {
        Notification notification = find(id);
        reads.deleteByNotificationId(id);
        notifications.delete(notification);
        notifyAfterCommit(null);
    }

    @Override
    public void delete(Long id, UserPrincipal actor) {
        Notification notification = find(id);
        boolean isPrivileged = actor.getAuthorities().stream().anyMatch(auth ->
                auth.getAuthority().equals("ROLE_ADMIN") || auth.getAuthority().equals("ROLE_PRINCIPAL"));
        boolean isRecipient = notification.getRecipient() != null && notification.getRecipient().getId().equals(actor.getId());

        if (!isPrivileged && !isRecipient) {
            throw new AppException("Notification deletion denied", HttpStatus.FORBIDDEN);
        }

        reads.deleteByNotificationId(id);
        notifications.delete(notification);
        notifyAfterCommit(notification.getRecipient() != null ? notification.getRecipient().getId() : null);
    }

    private void notifyAfterCommit(Long userId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() {
                    deliveries.forEach(delivery -> delivery.changed(userId));
                }
            });
        } else {
            deliveries.forEach(delivery -> delivery.changed(userId));
        }
    }

    private Notification find(Long id) {
        return notifications.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
    }

    private boolean visible(Notification notification, User user, UserPrincipal actor) {
        if (notification.getRecipient() != null) {
            return notification.getRecipient().getId().equals(actor.getId());
        }
        return notification.getFaculty() == null || actor.getAuthorities().stream().anyMatch(authority ->
                authority.getAuthority().equals("ROLE_ADMIN") || authority.getAuthority().equals("ROLE_PRINCIPAL"))
                || (user.getFaculties() != null && user.getFaculties().stream().anyMatch(faculty -> faculty.getId().equals(notification.getFaculty().getId())));
    }

    private NotificationResponse response(Notification notification, UserPrincipal actor) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getContent(),
                notification.getFaculty() == null ? null : notification.getFaculty().getId(),
                notification.getAuthor() != null ? notification.getAuthor().getFullName() : "Hệ thống",
                notification.getCreatedAt(),
                reads.existsByNotificationIdAndUserId(notification.getId(), actor.getId()),
                notification.getRecipient() != null ? notification.getRecipient().getId() : null
        );
    }
}
