package com.nexus.portal.controller;

import com.nexus.portal.dto.request.AssessmentRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.service.AssessmentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/assessments")
@PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL', 'TEACHER', 'COUNCIL')")
@Tag(name = "Module 13 - Reviews & Assessments")
public class AssessmentController {
    private final AssessmentService assessments;
    public AssessmentController(AssessmentService assessments) { this.assessments = assessments; }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AssessmentResponse>>> getAssessments(@RequestParam Long assignmentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(assessments.getAssessments(assignmentId, auth.getName())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AssessmentResponse>> saveDraft(@Valid @RequestBody AssessmentRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(assessments.saveDraft(request, auth.getName()), "Draft assessment saved"));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<AssessmentResponse>> submitAssessment(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(assessments.submitAssessment(id, auth.getName()), "Assessment submitted and locked"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(@PathVariable Long id, Authentication auth) {
        assessments.deleteDraft(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "Draft assessment deleted"));
    }
}
