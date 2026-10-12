package com.nexus.portal.controller;

import com.nexus.portal.config.ApiFeatureTag;
import com.nexus.portal.dto.response.AcademicReportOptionsResponse;
import com.nexus.portal.dto.response.AcademicReportRowResponse;
import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.enums.AcademicScoreBand;
import com.nexus.portal.enums.ApiFeature;
import com.nexus.portal.service.AcademicReportService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/results")
@ApiFeatureTag(ApiFeature.ACADEMIC_REPORTS)
public class AcademicReportController {
    private final AcademicReportService reports;

    public AcademicReportController(AcademicReportService reports) {
        this.reports = reports;
    }

    @GetMapping("/reports/options")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<AcademicReportOptionsResponse>> getReportOptions(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(reports.getReportOptions(auth.getName())));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<AcademicReportRowResponse>>> getAcademicReport(
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long topicId,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                reports.getAcademicReport(periodId, departmentId, topicId, auth.getName())));
    }

    @GetMapping(value = "/reports.csv", produces = "text/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<byte[]> exportAcademicReport(
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long topicId,
            Authentication auth) {
        List<AcademicReportRowResponse> rows =
                reports.getAcademicReport(periodId, departmentId, topicId, auth.getName());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("academic-results-report.csv", StandardCharsets.UTF_8).build());
        return ResponseEntity.ok().headers(headers)
                .body(toCsv(rows).getBytes(StandardCharsets.UTF_8));
    }

    private String toCsv(List<AcademicReportRowResponse> rows) {
        StringBuilder csv = new StringBuilder(
                "\uFEFFRegistration Period,Department,Topic,Student Count,Average Score,Passed,Failed");
        Arrays.stream(AcademicScoreBand.values())
                .forEach(band -> csv.append(',').append(csvField("Score " + band.getLabel())));
        csv.append("\r\n");
        for (AcademicReportRowResponse row : rows) {
            csv.append(csvField(row.periodName())).append(',')
                    .append(csvField(row.departmentName())).append(',')
                    .append(csvField(row.topicTitle())).append(',')
                    .append(row.studentCount()).append(',')
                    .append(row.averageFinalScore().toPlainString()).append(',')
                    .append(row.passCount()).append(',')
                    .append(row.failCount());
            Arrays.stream(AcademicScoreBand.values()).forEach(band -> csv.append(',')
                    .append(row.scoreDistribution().getOrDefault(band.getLabel(), 0L)));
            csv.append("\r\n");
        }
        return csv.toString();
    }

    private String csvField(String value) {
        String safe = value == null ? "" : value;
        String trimmed = safe.stripLeading();
        if (!trimmed.isEmpty() && "=+-@".indexOf(trimmed.charAt(0)) >= 0) {
            safe = "'" + safe;
        }
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
}
