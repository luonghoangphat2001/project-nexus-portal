package com.nexus.portal.controller;

import com.nexus.portal.dto.request.TopicRegistrationRequest;
import com.nexus.portal.dto.request.TopicReviewRequest;
import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.TopicRegistrationResponse;
import com.nexus.portal.service.TopicRegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/registrations")
@Tag(name = "Topic Registration", description = "Endpoints for team topic registrations, eligibility validation, and advisor review workflows")
public class TopicRegistrationController {

    private final TopicRegistrationService registrationService;

    public TopicRegistrationController(TopicRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Submit topic registration", description = "Team leader registers the team for a graduation topic during an open registration period (Students only)")
    public ResponseEntity<ApiResponse<TopicRegistrationResponse>> registerTopic(
            @Valid @RequestBody TopicRegistrationRequest request,
            Authentication authentication) {
        TopicRegistrationResponse response = registrationService.registerTopic(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Topic registration submitted successfully"));
    }

    @GetMapping("/my-team")
    @Operation(summary = "Get my team's registrations", description = "Retrieve all topic registration submissions made by the current user's team")
    public ResponseEntity<ApiResponse<List<TopicRegistrationResponse>>> getMyTeamRegistrations(Authentication authentication) {
        List<TopicRegistrationResponse> responses = registrationService.getMyTeamRegistrations(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(responses, "Team registrations retrieved"));
    }

    @GetMapping("/topic/{topicId}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Get registrations for topic", description = "Retrieve all student team registrations for a specific topic (Advisor/Admin/Principal only)")
    public ResponseEntity<ApiResponse<List<TopicRegistrationResponse>>> getTopicRegistrations(
            @Parameter(description = "Topic ID", required = true) @PathVariable Long topicId,
            Authentication authentication) {
        List<TopicRegistrationResponse> responses = registrationService.getTopicRegistrations(topicId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(responses, "Topic registrations retrieved"));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Review topic registration", description = "Advisor, admin, or department head approves or rejects a team registration. Approving locks the team roster.")
    public ResponseEntity<ApiResponse<TopicRegistrationResponse>> reviewRegistration(
            @Parameter(description = "Registration ID", required = true) @PathVariable Long id,
            @Valid @RequestBody TopicReviewRequest request,
            Authentication authentication) {
        TopicRegistrationResponse response = registrationService.reviewRegistration(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response, "Registration review saved"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Cancel topic registration", description = "Team leader cancels a pending topic registration")
    public ResponseEntity<ApiResponse<Void>> cancelRegistration(
            @Parameter(description = "Registration ID", required = true) @PathVariable Long id,
            Authentication authentication) {
        registrationService.cancelRegistration(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Registration cancelled successfully"));
    }
}
