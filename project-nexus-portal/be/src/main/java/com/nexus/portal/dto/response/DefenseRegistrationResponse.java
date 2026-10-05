package com.nexus.portal.dto.response;
import java.time.LocalDateTime;
import java.util.List;

public record DefenseRegistrationResponse(Long id, Long topicId, String topicTitle,
        Long teamId, String teamName, Long departmentId, String departmentName,
        Long periodId, String periodName, LocalDateTime submissionDeadline,
        boolean canSubmit, boolean canManage, List<Student> students) {
    public record Student(Long id, String fullName, String studentCode) {}
}
