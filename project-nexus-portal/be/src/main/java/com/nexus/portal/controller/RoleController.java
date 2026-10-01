package com.nexus.portal.controller;

import com.nexus.portal.dto.response.ApiResponse;
import com.nexus.portal.dto.response.RoleResponse;
import com.nexus.portal.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/roles")
@Tag(name = "Role Management", description = "Endpoints for retrieving system roles, descriptions, and user membership stats")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL') or hasRole('TEACHER')")
    @Operation(summary = "Get all system roles", description = "Retrieve list of all roles with their descriptions and count of assigned users")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        List<RoleResponse> roles = roleService.getAllRolesWithStats();
        return ResponseEntity.ok(ApiResponse.success(roles, "Roles retrieved successfully"));
    }
}
