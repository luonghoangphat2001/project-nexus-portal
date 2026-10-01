package com.nexus.portal.service;

import com.nexus.portal.dto.request.LoginRequest;
import com.nexus.portal.dto.request.RegisterRequest;
import com.nexus.portal.dto.response.AuthResponse;
import com.nexus.portal.dto.response.UserResponse;

public interface AuthService {
    AuthResponse login(LoginRequest loginRequest);

    UserResponse register(RegisterRequest registerRequest);

    UserResponse getCurrentUser();

    void changePassword(String username, com.nexus.portal.dto.request.ChangePasswordRequest request);
}
