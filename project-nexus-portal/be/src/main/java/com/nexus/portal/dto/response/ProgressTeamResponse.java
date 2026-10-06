package com.nexus.portal.dto.response;
import java.util.List;
public record ProgressTeamResponse(Long id, String name, String periodName, boolean canManage, boolean canReview,
        List<Member> members) {
    public record Member(Long id, String name) { }
}
