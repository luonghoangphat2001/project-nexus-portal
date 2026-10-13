package com.nexus.portal.controller;

import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.DefenseResultResponse;
import com.nexus.portal.service.ScoreCalculationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/results/assignments")
@Tag(name = "Score Calculation", description = "Endpoints for calculating and previewing defense scores")
public class ScoreCalculationController {
    private final ScoreCalculationService scoreCalculation;

    public ScoreCalculationController(ScoreCalculationService scoreCalculation) {
        this.scoreCalculation = scoreCalculation;
    }

    @GetMapping("/{assignmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<DefenseResultResponse>>> getAssignmentScores(
            @PathVariable Long assignmentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(scoreCalculation.getAssignmentScores(assignmentId, auth.getName())));
    }
}
