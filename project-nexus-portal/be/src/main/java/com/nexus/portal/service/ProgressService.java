package com.nexus.portal.service;
import com.nexus.portal.dto.request.*;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.security.UserPrincipal;
import java.util.List;
public interface ProgressService {
    List<ProgressTeamResponse> getTeams(UserPrincipal actor);
    List<ProgressTaskResponse> getTasks(Long teamId, UserPrincipal actor);
    ProgressTaskResponse save(Long teamId, Long id, ProgressTaskRequest request, UserPrincipal actor);
    ProgressTaskResponse updateStatus(Long id, ProgressStatusRequest request, UserPrincipal actor);
    ProgressTaskResponse review(Long id, ProgressFeedbackRequest request, UserPrincipal actor);
    void delete(Long id, UserPrincipal actor);
}
