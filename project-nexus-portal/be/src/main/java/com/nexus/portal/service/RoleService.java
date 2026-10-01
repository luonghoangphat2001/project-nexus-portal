package com.nexus.portal.service;

import com.nexus.portal.dto.response.RoleResponse;

import java.util.List;

public interface RoleService {
    List<RoleResponse> getAllRolesWithStats();
}
