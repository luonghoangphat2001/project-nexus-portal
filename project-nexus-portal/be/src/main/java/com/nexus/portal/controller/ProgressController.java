package com.nexus.portal.controller;
import com.nexus.portal.dto.request.*;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.security.UserPrincipal;
import com.nexus.portal.service.ProgressService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/progress")
public class ProgressController {
    private final ProgressService service;
    public ProgressController(ProgressService service) { this.service = service; }
    @GetMapping("/teams")
    public ResponseEntity<ApiResponse<List<ProgressTeamResponse>>> getTeams(@AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(service.getTeams(actor), "Progress teams retrieved"));
    }
    @GetMapping("/teams/{teamId}/tasks")
    public ResponseEntity<ApiResponse<List<ProgressTaskResponse>>> getTasks(@PathVariable Long teamId, @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(service.getTasks(teamId, actor), "Progress tasks retrieved"));
    }
    @PostMapping("/teams/{teamId}/tasks")
    public ResponseEntity<ApiResponse<ProgressTaskResponse>> create(@PathVariable Long teamId,
            @Valid @RequestBody ProgressTaskRequest request, @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.save(teamId, null, request, actor), "Progress task created"));
    }
    @PutMapping("/teams/{teamId}/tasks/{id}")
    public ResponseEntity<ApiResponse<ProgressTaskResponse>> update(@PathVariable Long teamId, @PathVariable Long id,
            @Valid @RequestBody ProgressTaskRequest request, @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(service.save(teamId, id, request, actor), "Progress task updated"));
    }
    @PutMapping("/tasks/{id}/status")
    public ResponseEntity<ApiResponse<ProgressTaskResponse>> updateStatus(@PathVariable Long id,
            @Valid @RequestBody ProgressStatusRequest request, @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(service.updateStatus(id, request, actor), "Task status updated"));
    }
    @PutMapping("/tasks/{id}/feedback")
    public ResponseEntity<ApiResponse<ProgressTaskResponse>> review(@PathVariable Long id,
            @Valid @RequestBody ProgressFeedbackRequest request, @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(service.review(id, request, actor), "Feedback saved"));
    }
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        service.delete(id, actor);
        return ResponseEntity.ok(ApiResponse.success(null, "Progress task deleted"));
    }
}
