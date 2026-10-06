package com.nexus.portal.dto.response;
import com.nexus.portal.enums.*;
import java.time.LocalDateTime;
import java.util.List;
public record CouncilResponse(Long id, String name, Long departmentId, String departmentName,
        Long periodId, String periodName, String room, LocalDateTime startsAt,
        LocalDateTime endsAt, CouncilStatus status, boolean canManage,
        List<Member> members, List<Assignment> assignments) {
    public record Member(Long lecturerId, String fullName, CouncilMemberRole role) {}
    public record Assignment(Long id, DefenseRegistrationResponse registration,
            boolean canReview, boolean canDefense) {}
}
