package com.nexus.portal.controller;

import com.nexus.portal.dto.response.*;
import com.nexus.portal.service.FinalResultService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/results")
@Tag(name = "Modules 14–16 - Kết quả bảo vệ và thống kê học tập")
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
                results.publishAssignmentGrades(assignmentId, auth.getName()), "Đã công bố kết quả"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<FinalGradeResponse>>> getMyPublishedGrades(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(results.getMyPublishedGrades(auth.getName())));
    }

    @GetMapping("/reports/options")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<AcademicReportOptionsResponse>> getReportOptions(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(results.getReportOptions(auth.getName())));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<AcademicReportRowResponse>>> getAcademicReport(
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long topicId,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                results.getAcademicReport(periodId, departmentId, topicId, auth.getName())));
    }

    @GetMapping(value = "/reports.csv", produces = "text/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<byte[]> exportAcademicReport(
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long topicId,
            Authentication auth) {
        List<AcademicReportRowResponse> rows =
                results.getAcademicReport(periodId, departmentId, topicId, auth.getName());
        String csv = toCsv(rows);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("bao-cao-ket-qua-hoc-tap.csv", StandardCharsets.UTF_8).build());
        return ResponseEntity.ok().headers(headers).body(csv.getBytes(StandardCharsets.UTF_8));
    }

    private String toCsv(List<AcademicReportRowResponse> rows) {
        StringBuilder csv = new StringBuilder("\uFEFFĐợt đăng ký,Khoa,Đề tài,Số sinh viên,Điểm trung bình,Đạt,Chưa đạt");
        AcademicReportRowResponse.SCORE_BANDS.forEach(band -> csv.append(',').append(csvField("Điểm " + band)));
        csv.append("\r\n");
        for (AcademicReportRowResponse row : rows) {
            csv.append(csvField(row.periodName())).append(',')
                    .append(csvField(row.departmentName())).append(',')
                    .append(csvField(row.topicTitle())).append(',')
                    .append(row.studentCount()).append(',')
                    .append(row.averageFinalScore().toPlainString()).append(',')
                    .append(row.passCount()).append(',')
                    .append(row.failCount());
            AcademicReportRowResponse.SCORE_BANDS.forEach(
                    band -> csv.append(',').append(row.scoreDistribution().getOrDefault(band, 0L)));
            csv.append("\r\n");
        }
        return csv.toString();
    }

    private String csvField(String value) {
        String safe = value == null ? "" : value;
        String trimmed = safe.stripLeading();
        if (!trimmed.isEmpty() && "=+-@".indexOf(trimmed.charAt(0)) >= 0) safe = "'" + safe;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
}
