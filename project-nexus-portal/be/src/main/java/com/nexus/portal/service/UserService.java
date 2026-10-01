package com.nexus.portal.service;

import com.nexus.portal.dto.request.AdminUserCreateRequest;
import com.nexus.portal.dto.request.UserProfileUpdateRequest;
import com.nexus.portal.dto.request.UserUpdateRequest;
import com.nexus.portal.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

public interface UserService {
    Page<UserResponse> getAllUsers(Pageable pageable);

    UserResponse getUserById(Long id);

    UserResponse updateUser(Long id, UserUpdateRequest updateRequest);

    void deleteUser(Long id);

    void toggleUserStatus(Long id);

    List<UserResponse> getScopedLecturers(String currentUserEmail);

    UserResponse updateCurrentUserProfile(String username, UserProfileUpdateRequest request);

    UserResponse createUserByAdmin(AdminUserCreateRequest request, String performedBy);

    UserResponse updateUserRoles(Long userId, Set<String> roles, String performedBy);

    void resetPassword(Long userId, String newPassword, String performedBy);

    byte[] exportUsersCsv();
}
