package com.nexus.portal.controller;

import com.nexus.portal.dto.request.GradeAppealRequest;
import com.nexus.portal.dto.request.GradeAppealStatusRequest;
import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.GradeAppealResponse;
import com.nexus.portal.service.GradeAppealService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/appeals")
@Tag(name = "Grade Appeals", description = "Endpoints for student thesis score appeal and re-evaluation requests")
public class GradeAppealController {

    private final GradeAppealService appeals;

    public GradeAppealController(GradeAppealService appeals) {
        this.appeals = appeals;
    }

    @PostMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> submitAppeal(
            @PathVariable Long assignmentId,
            @Valid @RequestBody GradeAppealRequest request,
            Authentication auth) {
        GradeAppealResponse response = appeals.submitAppeal(assignmentId, request, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(response, "Đã gửi đơn phúc khảo thành công"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<GradeAppealResponse>>> getMyAppeals(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(appeals.getMyAppeals(auth.getName())));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL', 'TEACHER', 'COUNCIL')")
    public ResponseEntity<ApiResponse<List<GradeAppealResponse>>> getAppeals(
            @RequestParam(required = false) Long assignmentId,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(appeals.getAppeals(assignmentId, auth.getName())));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<GradeAppealResponse>> updateAppealStatus(
            @PathVariable Long id,
            @Valid @RequestBody GradeAppealStatusRequest request,
            Authentication auth) {
        GradeAppealResponse response = appeals.updateAppealStatus(id, request, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái đơn phúc khảo thành công"));
    }
}

