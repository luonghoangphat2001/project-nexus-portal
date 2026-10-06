package com.nexus.portal.controller;

import com.nexus.portal.dto.request.*;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.service.CouncilService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/councils")
@Tag(name = "Module 12 - Defense Councils")
public class CouncilController {
    private final CouncilService councils;
    public CouncilController(CouncilService councils) { this.councils = councils; }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CouncilResponse>>> getCouncils(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(councils.getCouncils(auth.getName())));
    }

    @GetMapping("/options")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<CouncilOptionsResponse>> getOptions(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(councils.getOptions(auth.getName())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<CouncilResponse>> createCouncil(@Valid @RequestBody CouncilRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(
                councils.createCouncil(request, auth.getName()), "Council created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<CouncilResponse>> updateCouncil(@PathVariable Long id,
            @Valid @RequestBody CouncilRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(councils.updateCouncil(id, request, auth.getName()), "Council updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<CouncilResponse>> changeStatus(@PathVariable Long id,
            @Valid @RequestBody CouncilStatusRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(councils.changeStatus(id, request, auth.getName())));
    }

    @PostMapping("/{id}/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<CouncilResponse>> assignRegistration(@PathVariable Long id,
            @Valid @RequestBody DefenseAssignmentRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(councils.assignRegistration(id, request, auth.getName()), "Team assigned successfully"));
    }

    @DeleteMapping("/{id}/assignments/{assignmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<Void>> removeAssignment(@PathVariable Long id, @PathVariable Long assignmentId, Authentication auth) {
        councils.removeAssignment(id, assignmentId, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Assignment removed successfully"));
    }
}
