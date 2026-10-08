package com.nexus.portal.repository;
import com.nexus.portal.model.ProgressTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProgressTaskRepository extends JpaRepository<ProgressTask, Long> {
    List<ProgressTask> findByTeamIdOrderByDueDateAsc(Long teamId);
}
