package com.nexus.portal.controller;

import com.nexus.portal.controller.base.CsvExportController;
import com.nexus.portal.dto.response.ResultStatisticsResponse;
import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.enums.ScoreRange;
import com.nexus.portal.service.ResultStatisticsService;
import com.nexus.portal.service.ScoreCalculationService.ScoreRangeClassifier;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/results")
@Tag(name = "Academic Reports", description = "Endpoints for statistics and CSV export of published academic results")
public class ResultStatisticsController extends CsvExportController<ResultStatisticsResponse.Row> {
    private final ResultStatisticsService reports;

    public ResultStatisticsController(ResultStatisticsService reports) {
        this.reports = reports;
    }

    @GetMapping("/reports/options")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<ResultStatisticsResponse.Options>> getFilterOptions(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(reports.getFilterOptions(auth.getName())));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<ResultStatisticsResponse.Row>>> getStatistics(
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long topicId,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                reports.getStatistics(periodId, departmentId, topicId, auth.getName())));
    }

    @GetMapping(value = "/reports.csv", produces = "text/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<byte[]> exportStatisticsCsv(
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long topicId,
            Authentication auth) {
        return buildCsvResponse(reports.getStatistics(periodId, departmentId, topicId, auth.getName()));
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
    protected List<?> exportRow(ResultStatisticsResponse.Row row) {
        List<Object> cells = new ArrayList<>(Arrays.asList(
                row.periodName(), row.departmentName(), row.topicTitle(),
                row.studentCount(), row.averageFinalScore(), row.passCount(), row.failCount()));
        Arrays.stream(ScoreRange.values()).forEach(range -> cells.add(
                row.scoreDistribution().getOrDefault(ScoreRangeClassifier.labelOf(range), 0L)));
        return cells;
    }
}
