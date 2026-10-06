package com.nexus.portal.controller;
import com.nexus.portal.dto.request.NotificationRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.security.UserPrincipal;
import com.nexus.portal.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationService service;
    public NotificationController(NotificationService service) { this.service = service; }
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAll(@AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(service.getAll(actor), "Notifications retrieved"));
    }
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<NotificationResponse>> create(@Valid @RequestBody NotificationRequest request,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(request, actor), "Notification published"));
    }
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        service.markRead(id, actor);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification deleted"));
    }
}
