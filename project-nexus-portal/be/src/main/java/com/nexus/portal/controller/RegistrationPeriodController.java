package com.nexus.portal.controller;

import com.nexus.portal.dto.request.RegistrationPeriodRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.service.PeriodExcelExporter;
import com.nexus.portal.service.RegistrationPeriodService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/periods")
public class RegistrationPeriodController {
    private final RegistrationPeriodService service;
    public RegistrationPeriodController(RegistrationPeriodService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<List<RegistrationPeriodResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll(), "Registration periods retrieved"));
    }

    @GetMapping(value = "/export.xlsx", produces = PeriodExcelExporter.CONTENT_TYPE)
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    @Operation(summary = "Export registration periods to Excel")
    public ResponseEntity<byte[]> exportPeriodsExcel(Locale locale) {
        List<RegistrationPeriodResponse> periods = service.getAll();
        byte[] workbook = PeriodExcelExporter.export(periods, locale);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + PeriodExcelExporter.fileName(locale) + "\"")
                .body(workbook);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<RegistrationPeriodResponse>> create(@Valid @RequestBody RegistrationPeriodRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.save(null, request), "Registration period created"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRINCIPAL')")
    public ResponseEntity<ApiResponse<RegistrationPeriodResponse>> update(@PathVariable Long id, @Valid @RequestBody RegistrationPeriodRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.save(id, request), "Registration period updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Registration period deleted"));
    }
}
