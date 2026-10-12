package com.nexus.portal.controller;

import com.nexus.portal.config.ApiFeatureTag;
import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.FinalGradeResponse;
import com.nexus.portal.enums.ApiFeature;
import com.nexus.portal.service.FinalResultService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/results")
@ApiFeatureTag(ApiFeature.FINAL_RESULTS)
public class FinalResultController {
    private final FinalResultService results;

    public FinalResultController(FinalResultService results) {
        this.results = results;
    }

    @GetMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<FinalGradeResponse>>> getAssignmentGrades(
            @PathVariable Long assignmentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(results.getAssignmentGrades(assignmentId, auth.getName())));
    }

    @PostMapping("/assignments/{assignmentId}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<FinalGradeResponse>>> publishAssignmentGrades(
            @PathVariable Long assignmentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                results.publishAssignmentGrades(assignmentId, auth.getName()), "Results published successfully"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<FinalGradeResponse>>> getMyPublishedGrades(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(results.getMyPublishedGrades(auth.getName())));
    }
}
