package com.nexus.portal.repository;
import com.nexus.portal.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
public interface NotificationRepository extends JpaRepository<Notification, Long> { }
