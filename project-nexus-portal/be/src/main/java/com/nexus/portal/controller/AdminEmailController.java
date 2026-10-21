package com.nexus.portal.controller;

import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/email")
@Tag(name = "Admin Email Management", description = "Endpoints for managing and testing SMTP email integration")
public class AdminEmailController {

    private final EmailService emailService;

    public AdminEmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get SMTP configuration status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEmailStatus() {
        Map<String, Object> status = Map.of(
                "enabled", emailService.isEnabled(),
                "configured", emailService.isConfigured(),
                "host", emailService.getHost(),
                "port", emailService.getPort(),
                "sender", emailService.getSender()
        );
        return ResponseEntity.ok(ApiResponse.success(status, "Email status retrieved"));
    }

    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send a test email using configured SMTP")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendTestEmail(@RequestBody Map<String, String> request) {
        String recipient = request.get("recipient");
        if (recipient == null || recipient.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Recipient email is required", 400));
        }

        try {
            boolean success = emailService.testConnection(recipient.trim());
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("success", success, "recipient", recipient),
                    emailService.isConfigured()
                            ? "Test email sent successfully to " + recipient
                            : "Mock email logged (SMTP credentials not yet filled)"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to send test email: " + e.getMessage(), 500));
        }
    }
}
