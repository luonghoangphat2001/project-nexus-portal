package com.nexus.portal.repository;

import com.nexus.portal.model.Notification;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never", "spring.jpa.show-sql=false",
        "spring.datasource.url=jdbc:h2:mem:modules;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password=", "spring.datasource.driver-class-name=org.h2.Driver"
})
class ModuleRepositoryTest {
    @Autowired private NotificationRepository notifications;
    @Autowired private NotificationReadRepository reads;
    @Autowired private ProgressTaskRepository tasks;
    @Autowired private TopicRepository topics;
    @Test void newTablesAndRepositoryQueriesAreAvailable() {
        assertEquals(0, notifications.count());
        assertFalse(reads.existsByNotificationIdAndUserId(1L, 1L));
        assertTrue(tasks.findByTeamIdOrderByDueDateAsc(1L).isEmpty());
        assertFalse(topics.existsByPeriodId(1L));
    }
}
