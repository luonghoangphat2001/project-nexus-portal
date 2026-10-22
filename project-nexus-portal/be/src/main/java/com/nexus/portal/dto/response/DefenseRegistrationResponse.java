package com.nexus.portal.dto.response;
import java.time.LocalDateTime;
import java.util.List;

public record DefenseRegistrationResponse(Long id, Long topicId, String topicTitle,
        Long teamId, String teamName, Long departmentId, String departmentName,
        Long periodId, String periodName, LocalDateTime submissionDeadline,
        boolean canSubmit, boolean canManage, List<Student> students,
        List<Advisor> advisors) {

    public DefenseRegistrationResponse(Long id, Long topicId, String topicTitle,
            Long teamId, String teamName, Long departmentId, String departmentName,
            Long periodId, String periodName, LocalDateTime submissionDeadline,
            boolean canSubmit, boolean canManage, List<Student> students) {
        this(id, topicId, topicTitle, teamId, teamName, departmentId, departmentName,
                periodId, periodName, submissionDeadline, canSubmit, canManage, students, List.of());
    }

    public record Student(Long id, String fullName, String studentCode, Boolean isLeader) {
        public Student(Long id, String fullName, String studentCode) {
            this(id, fullName, studentCode, false);
        }
    }
    public record Advisor(Long id, String fullName, String email, String role) {}
}
