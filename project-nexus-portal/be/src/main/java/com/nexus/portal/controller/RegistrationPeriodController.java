package com.nexus.portal.controller;

import com.nexus.portal.dto.request.RegistrationPeriodRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.service.RegistrationPeriodService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/periods")
public class RegistrationPeriodController {
    private final RegistrationPeriodService service;
    public RegistrationPeriodController(RegistrationPeriodService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RegistrationPeriodResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll(), "Registration periods retrieved"));
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
