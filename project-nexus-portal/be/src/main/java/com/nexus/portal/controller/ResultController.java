package com.nexus.portal.controller;

import com.nexus.portal.controller.base.CsvExportController;
import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.ResultResponse;
import com.nexus.portal.enums.ScoreRange;
import com.nexus.portal.service.ResultService;
import com.nexus.portal.service.ScoreCalculationService.ScoreRangeClassifier;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/results")
@Tag(name = "Results", description = "Endpoints for publishing results and viewing academic statistics")
public class ResultController extends CsvExportController<ResultResponse.Statistics.Row> {
    private final ResultService results;

    public ResultController(ResultService results) {
        this.results = results;
    }

    @PostMapping("/assignments/{assignmentId}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<ResultResponse.Defense>>> publishAssignmentResults(
            @PathVariable Long assignmentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                    results.publishAssignmentResults(assignmentId, auth.getName()), "Results published"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<ResultResponse.Defense>>> getMyPublishedResults(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(results.getMyPublishedResults(auth.getName())));
    }

    @GetMapping("/reports/options")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<ResultResponse.Statistics.Options>> getFilterOptions(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(results.getFilterOptions(auth.getName())));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<ResultResponse.Statistics.Row>>> getStatistics(
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long topicId,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                    results.getStatistics(periodId, departmentId, topicId, auth.getName())));
    }

    @GetMapping(value = "/reports.csv", produces = "text/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<byte[]> exportStatisticsCsv(
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long topicId,
            Authentication auth) {
        return buildCsvResponse(results.getStatistics(periodId, departmentId, topicId, auth.getName()));
    }

    @Override
    protected String exportFileName() {
        return "academic-results-report.csv";
    }

    @Override
    protected List<String> exportHeaders() {
        List<String> headers = new ArrayList<>(List.of(
                "Registration Period", "Department", "Topic", "Students", "Average Score", "Passed", "Failed"));
        Arrays.stream(ScoreRange.values())
                .forEach(range -> headers.add("Score " + ScoreRangeClassifier.labelOf(range)));
        return headers;
    }

    @Override
    protected List<?> exportRow(ResultResponse.Statistics.Row row) {
        List<Object> cells = new ArrayList<>(Arrays.asList(
                row.periodName(), row.departmentName(), row.topicTitle(),
                row.studentCount(), row.averageFinalScore(), row.passCount(), row.failCount()));
        Arrays.stream(ScoreRange.values()).forEach(range -> cells.add(
                row.scoreDistribution().getOrDefault(ScoreRangeClassifier.labelOf(range), 0L)));
        return cells;
    }
}
