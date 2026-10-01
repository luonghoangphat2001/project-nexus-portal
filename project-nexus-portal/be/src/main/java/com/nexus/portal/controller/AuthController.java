package com.nexus.portal.controller;

import com.nexus.portal.dto.request.LoginRequest;
import com.nexus.portal.dto.request.RegisterRequest;
import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.AuthResponse;
import com.nexus.portal.dto.response.UserResponse;
import com.nexus.portal.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration, authentication, and session identity")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @SecurityRequirements
    @Operation(
            summary = "User login",
            description = "Authenticate using username/email and password to receive a JWT access token. Select an example from the dropdown to test with seed credentials."
    )
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    description = "Login credentials payload",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = LoginRequest.class),
                            examples = {
                                    @ExampleObject(
                                            name = "Admin Account",
                                            summary = "System Administrator (superadmin)",
                                            value = "{\"usernameOrEmail\": \"superadmin\", \"password\": \"password123\"}"
                                    )
                            }
                    )
            )
            @Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successfully"));
    }

    @PostMapping("/register")
    @SecurityRequirements
    @Operation(
            summary = "User registration",
            description = "Register a new user account with credentials and profile information."
    )
    public ResponseEntity<ApiResponse<UserResponse>> register(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    description = "User registration payload",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = RegisterRequest.class),
                            examples = {
                                    @ExampleObject(
                                            name = "Standard User Registration",
                                            summary = "New individual user account",
                                            value = "{\"username\": \"new_student\", \"email\": \"student@nexus.local\", \"password\": \"password123\", \"fullName\": \"Nguyen Van B\", \"roles\": [\"ROLE_USER\"]}"
                                    )
                            }
                    )
            )
            @Valid @RequestBody RegisterRequest registerRequest) {
        UserResponse response = authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "User registered successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Retrieve profile details of the authenticated user from the provided Bearer token.")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        UserResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(response, "Retrieved current user profile"));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password", description = "Change the password of the currently authenticated user")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody com.nexus.portal.dto.request.ChangePasswordRequest request,
            org.springframework.security.core.Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        if (username == null) {
            throw new com.nexus.portal.exception.BadRequestException("Authentication required to change password!");
        }
        authService.changePassword(username, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    }
}

