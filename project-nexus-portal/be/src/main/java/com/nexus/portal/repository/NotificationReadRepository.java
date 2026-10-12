package com.nexus.portal.repository;
import com.nexus.portal.model.NotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;
public interface NotificationReadRepository extends JpaRepository<NotificationRead, Long> {
    boolean existsByNotificationIdAndUserId(Long notificationId, Long userId);
    void deleteByNotificationId(Long notificationId);
}
