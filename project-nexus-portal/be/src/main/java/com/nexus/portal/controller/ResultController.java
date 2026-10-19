package com.nexus.portal.controller;

import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.ResultResponse;
import com.nexus.portal.service.ResultExcelExporter;
import com.nexus.portal.service.ResultService;
import com.nexus.portal.service.ScoreCalculationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/results")
@Tag(name = "Results", description = "Score calculation, result publication and academic reports")
public class ResultController {
    private final ResultService results;
    private final ScoreCalculationService scoreCalculation;

    public ResultController(ResultService results, ScoreCalculationService scoreCalculation) {
        this.results = results;
        this.scoreCalculation = scoreCalculation;
    }

    @GetMapping("/assignments/{assignmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<ResultResponse.Defense>>> getAssignmentScores(
            @PathVariable Long assignmentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                scoreCalculation.getAssignmentScores(assignmentId, auth.getName())));
    }

    @PostMapping("/assignments/{assignmentId}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<ResultResponse.Defense>>> publishAssignmentResults(
            @PathVariable Long assignmentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                results.publishAssignmentResults(assignmentId, auth.getName()), "Results published"));
    }

    @PostMapping("/periods/{periodId}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<ResultResponse.Defense>>> publishPeriodResults(
            @PathVariable Long periodId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                results.publishPeriodResults(periodId, auth.getName()), "Results published"));
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

    @GetMapping(value = "/reports.xlsx", produces = ResultExcelExporter.CONTENT_TYPE)
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<byte[]> exportDetailedReportExcel(
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long topicId,
            Authentication auth) {
        byte[] workbook = ResultExcelExporter.export(
                results.getDetailedReport(periodId, departmentId, topicId, auth.getName()));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(ResultExcelExporter.CONTENT_TYPE));
        headers.setContentDisposition(ContentDisposition.attachment().filename(ResultExcelExporter.FILE_NAME).build());
        return ResponseEntity.ok().headers(headers).body(workbook);
    }
}
