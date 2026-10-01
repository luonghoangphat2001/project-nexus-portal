package com.nexus.portal.controller;

import com.nexus.portal.dto.request.AdminUserCreateRequest;
import com.nexus.portal.dto.request.ResetPasswordRequest;
import com.nexus.portal.dto.request.UserProfileUpdateRequest;
import com.nexus.portal.dto.request.UserRoleUpdateRequest;
import com.nexus.portal.dto.request.UserUpdateRequest;
import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.UserResponse;
import com.nexus.portal.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@Tag(name = "User Management", description = "Endpoints for managing user accounts, permissions, and statuses")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/lecturers")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL') or hasRole('TEACHER')")
    @Operation(summary = "Get scoped lecturers / teaching staff", 
               description = "Retrieve lecturers based on role: Super Admin sees all; Department/Faculty Head sees within their faculty/department; Teacher sees only assigned supervising lecturers.")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getScopedLecturers(Authentication authentication) {
        List<UserResponse> lecturers = userService.getScopedLecturers(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(lecturers, "Scoped lecturers retrieved successfully"));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Get paginated users", description = "Retrieve a paginated and sorted list of users.")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(
            @Parameter(description = "Zero-based page index") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Field name to sort by (e.g. id, username, email, createdAt)") @RequestParam(defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction: asc or desc") @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(users, "Retrieved users successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieve detailed user information for a specific user ID.")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @Parameter(description = "ID of the user to retrieve", required = true) @PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user, "Retrieved user details"));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user profile", description = "Allows the logged-in user to update their own full name, phone number, student code, and avatar URL.")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UserProfileUpdateRequest request, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        UserResponse updated = userService.updateCurrentUserProfile(username, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "User profile updated successfully"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create user by Admin", description = "Allows Administrator to create new user accounts with specific roles and affiliations.")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody AdminUserCreateRequest request, Authentication authentication) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        UserResponse created = userService.createUserByAdmin(request, adminUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(created, "User created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user details", description = "Requires ADMIN role. Updates email, full name, role, and active status.")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @Parameter(description = "ID of the user to update", required = true) @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest updateRequest) {
        UserResponse updated = userService.updateUser(id, updateRequest);
        return ResponseEntity.ok(ApiResponse.success(updated, "User updated successfully"));
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user roles", description = "Requires ADMIN role. Assigns or modifies the set of roles for a user.")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRoles(
            @PathVariable Long id,
            @Valid @RequestBody UserRoleUpdateRequest roleRequest,
            Authentication authentication) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        UserResponse updated = userService.updateUserRoles(id, roleRequest.getRoles(), adminUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "User roles updated successfully"));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset user password", description = "Requires ADMIN role. Resets user password to a new value.")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request,
            Authentication authentication) {
        String adminUser = authentication != null ? authentication.getName() : "ADMIN";
        userService.resetPassword(id, request.getNewPassword(), adminUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle user active status", description = "Requires ADMIN role. Inverts the user active flag between true and false.")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(
            @Parameter(description = "ID of the user to toggle status", required = true) @PathVariable Long id) {
        userService.toggleUserStatus(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User status toggled successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user", description = "Requires ADMIN role. Permanently deletes a user account by ID.")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @Parameter(description = "ID of the user to delete", required = true) @PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Export users to CSV", description = "Download full user list as a CSV file")
    public ResponseEntity<byte[]> exportUsersCsv() {
        byte[] csvData = userService.exportUsersCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"users.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
