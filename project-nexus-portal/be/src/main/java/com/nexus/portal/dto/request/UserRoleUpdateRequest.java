package com.nexus.portal.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

public class UserRoleUpdateRequest {

    @NotEmpty(message = "Roles set cannot be empty")
    private Set<String> roles;

    public UserRoleUpdateRequest() {
    }

    public UserRoleUpdateRequest(Set<String> roles) {
        this.roles = roles;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }
}
