package com.nexus.portal.service.impl;

import com.nexus.portal.exception.AppException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationServiceImplTest {
    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final NotificationReadRepository reads = mock(NotificationReadRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final NotificationServiceImpl service = new NotificationServiceImpl(notifications, reads, users, mock(FacultyRepository.class));
    private final UserPrincipal actor = new UserPrincipal(1L, "student", "student@example.com", "", "Student", true,
            List.of(new SimpleGrantedAuthority("ROLE_USER")));
    @Test void rejectsReadingNotificationForAnotherFaculty() {
        Faculty faculty = new Faculty(); faculty.setId(2L);
        Notification notification = new Notification(); notification.setFaculty(faculty);
        when(notifications.findById(8L)).thenReturn(Optional.of(notification));
        when(users.findById(1L)).thenReturn(Optional.of(new User()));
        assertThrows(AppException.class, () -> service.markRead(8L, actor));
        verify(reads, never()).save(any());
    }
    @Test void repeatedReadDoesNotCreateDuplicate() {
        when(notifications.findById(8L)).thenReturn(Optional.of(new Notification()));
        when(users.findById(1L)).thenReturn(Optional.of(new User()));
        when(reads.existsByNotificationIdAndUserId(8L, 1L)).thenReturn(true);
        service.markRead(8L, actor);
        verify(reads, never()).save(any());
    }
    @Test void facultyMemberCanReadTheirNotification() {
        Faculty faculty = new Faculty(); faculty.setId(2L);
        Notification notification = new Notification(); notification.setFaculty(faculty);
        User user = new User(); user.setFaculties(Set.of(faculty));
        when(notifications.findById(8L)).thenReturn(Optional.of(notification));
        when(users.findById(1L)).thenReturn(Optional.of(user));
        service.markRead(8L, actor);
        verify(reads).save(any(NotificationRead.class));
    }
}
