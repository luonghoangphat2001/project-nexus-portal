package com.nexus.portal.controller;

import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.DefenseResultResponse;
import com.nexus.portal.service.ResultPublicationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/results")
@Tag(name = "Published Results", description = "Endpoints for publishing and viewing defense results")
public class ResultPublicationController {
    private final ResultPublicationService results;

    public ResultPublicationController(ResultPublicationService results) {
        this.results = results;
    }

    @PostMapping("/assignments/{assignmentId}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<DefenseResultResponse>>> publishAssignmentResults(
            @PathVariable Long assignmentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                results.publishAssignmentResults(assignmentId, auth.getName()), "Results published"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<DefenseResultResponse>>> getMyPublishedResults(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(results.getMyPublishedResults(auth.getName())));
    }
}
