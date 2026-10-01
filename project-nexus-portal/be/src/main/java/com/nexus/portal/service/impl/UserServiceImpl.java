package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.AdminUserCreateRequest;
import com.nexus.portal.dto.request.UserProfileUpdateRequest;
import com.nexus.portal.dto.request.UserUpdateRequest;
import com.nexus.portal.dto.response.UserResponse;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.AuditLogService;
import com.nexus.portal.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final MajorRepository majorRepository;
    private final CohortRepository cohortRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public UserServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           FacultyRepository facultyRepository,
                           DepartmentRepository departmentRepository,
                           MajorRepository majorRepository,
                           CohortRepository cohortRepository,
                           PasswordEncoder passwordEncoder,
                           AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.majorRepository = majorRepository;
        this.cohortRepository = cohortRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::mapToUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest updateRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!user.getEmail().equalsIgnoreCase(updateRequest.getEmail()) &&
                userRepository.existsByEmail(updateRequest.getEmail())) {
            throw new BadRequestException("Email is already in use by another account!");
        }

        user.setFullName(updateRequest.getFullName());
        user.setEmail(updateRequest.getEmail());
        if (updateRequest.getAvatarUrl() != null) {
            user.setAvatarUrl(updateRequest.getAvatarUrl());
        }
        if (updateRequest.getActive() != null) {
            user.setActive(updateRequest.getActive());
        }

        if (updateRequest.getRoles() != null && !updateRequest.getRoles().isEmpty()) {
            Set<Role> updatedRoles = new HashSet<>();
            for (RoleName roleName : updateRequest.getRoles()) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName));
                updatedRoles.add(role);
            }
            user.setRoles(updatedRoles);
        }

        User updatedUser = userRepository.save(user);

        auditLogService.log(user.getId(), user.getUsername(), "UPDATE_USER", "User",
                "User account updated: " + user.getUsername(), "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        userRepository.delete(user);

        auditLogService.log(id, user.getUsername(), "DELETE_USER", "User",
                "User account deleted: " + user.getUsername(), "127.0.0.1", "NexusPortal/Admin", "SUCCESS");
    }

    @Override
    @Transactional
    public void toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        user.setActive(!user.isActive());
        userRepository.save(user);

        String statusStr = user.isActive() ? "Activated" : "Deactivated";
        auditLogService.log(id, user.getUsername(), "TOGGLE_USER_STATUS", "User",
                statusStr + " user account: " + user.getUsername(), "127.0.0.1", "NexusPortal/Admin", "SUCCESS");
    }

    @Override
    @Transactional
    public UserResponse updateCurrentUserProfile(String username, UserProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        user.setFullName(request.getFullName().trim());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }
        if (request.getStudentCode() != null && !request.getStudentCode().trim().isEmpty()) {
            user.setStudentCode(request.getStudentCode().trim());
        }

        User saved = userRepository.save(user);

        auditLogService.log(user.getId(), username, "UPDATE_PROFILE", "User",
                "Profile updated", "127.0.0.1", "NexusPortal", "SUCCESS");

        return mapToUserResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse createUserByAdmin(AdminUserCreateRequest request, String performedBy) {
        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new BadRequestException("Username '" + request.getUsername() + "' already exists!");
        }

        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new BadRequestException("Email '" + request.getEmail() + "' already exists!");
        }

        Set<Role> roles = new HashSet<>();
        for (String roleStr : request.getRoles()) {
            try {
                RoleName roleName = RoleName.valueOf(roleStr.trim().toUpperCase());
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role does not exist: " + roleStr));
                roles.add(role);
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid role: " + roleStr);
            }
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        user.setFullName(request.getFullName().trim());
        user.setStudentCode(request.getStudentCode() != null ? request.getStudentCode().trim() : null);
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setAvatarUrl(request.getAvatarUrl() != null ? request.getAvatarUrl().trim() : "https://ui-avatars.com/api/?name=" + request.getUsername() + "&background=6366f1&color=fff");
        user.setActive(true);
        user.setRoles(roles);

        if (request.getCohortId() != null) {
            cohortRepository.findById(request.getCohortId()).ifPresent(user::setCohort);
        }
        if (request.getMajorId() != null) {
            majorRepository.findById(request.getMajorId()).ifPresent(user::setMajor);
        }
        if (request.getFacultyId() != null) {
            facultyRepository.findById(request.getFacultyId()).ifPresent(f -> user.getFaculties().add(f));
        }
        if (request.getDepartmentId() != null) {
            departmentRepository.findById(request.getDepartmentId()).ifPresent(d -> user.getDepartments().add(d));
        }

        User saved = userRepository.save(user);

        auditLogService.log(saved.getId(), performedBy, "CREATE_USER_BY_ADMIN", "User",
                "Admin created user account: " + saved.getUsername() + " (" + saved.getEmail() + ")",
                "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return mapToUserResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUserRoles(Long userId, Set<String> roleStrings, String performedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Set<Role> roles = new HashSet<>();
        for (String roleStr : roleStrings) {
            try {
                RoleName roleName = RoleName.valueOf(roleStr.trim().toUpperCase());
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role does not exist: " + roleStr));
                roles.add(role);
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid role name: " + roleStr);
            }
        }

        user.setRoles(roles);
        User saved = userRepository.save(user);

        String roleListStr = roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", "));
        auditLogService.log(user.getId(), performedBy, "ASSIGN_USER_ROLES", "User",
                "Updated roles for user " + user.getUsername() + ": [" + roleListStr + "]",
                "127.0.0.1", "NexusPortal/Admin", "SUCCESS");

        return mapToUserResponse(saved);
    }

    @Override
    @Transactional
    public void resetPassword(Long userId, String newPassword, String performedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);

        auditLogService.log(user.getId(), performedBy, "RESET_USER_PASSWORD", "User",
                "Admin reset password for user: " + user.getUsername(),
                "127.0.0.1", "NexusPortal/Admin", "SUCCESS");
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportUsersCsv() {
        List<User> users = userRepository.findAll();

        StringBuilder csv = new StringBuilder();
        csv.append('\ufeff'); // UTF-8 BOM
        csv.append("ID,Username,Email,FullName,StudentCode,Phone,Active,Roles,CreatedAt\n");

        for (User u : users) {
            String roleStr = u.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.joining(";"));
            csv.append(u.getId()).append(",")
                    .append(escapeCsv(u.getUsername())).append(",")
                    .append(escapeCsv(u.getEmail())).append(",")
                    .append(escapeCsv(u.getFullName())).append(",")
                    .append(escapeCsv(u.getStudentCode())).append(",")
                    .append(escapeCsv(u.getPhone())).append(",")
                    .append(u.isActive()).append(",")
                    .append(escapeCsv(roleStr)).append(",")
                    .append(u.getCreatedAt() != null ? u.getCreatedAt().format(FORMATTER) : "")
                    .append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getScopedLecturers(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseGet(() -> userRepository.findByUsername(currentUserEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + currentUserEmail)));

        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
        boolean isPrincipal = currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_PRINCIPAL);
        boolean isTeacher = currentUser.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_TEACHER);

        if (isAdmin) {
            return userRepository.findAllLecturers().stream().map(this::mapToUserResponse).collect(Collectors.toList());
        }

        if (isPrincipal) {
            Set<Long> facultyIds = currentUser.getFaculties().stream().map(Faculty::getId).collect(Collectors.toSet());
            Set<Long> deptIds = currentUser.getDepartments().stream().map(Department::getId).collect(Collectors.toSet());

            if (facultyIds.isEmpty() && deptIds.isEmpty()) {
                return Collections.emptyList();
            }

            if (!facultyIds.isEmpty() && !deptIds.isEmpty()) {
                return userRepository.findLecturersByFacultiesOrDepartments(facultyIds, deptIds).stream()
                        .map(this::mapToUserResponse)
                        .collect(Collectors.toList());
            } else if (!facultyIds.isEmpty()) {
                return userRepository.findLecturersByFacultyIds(facultyIds).stream()
                        .map(this::mapToUserResponse)
                        .collect(Collectors.toList());
            } else {
                return userRepository.findLecturersByDepartmentIds(deptIds).stream()
                        .map(this::mapToUserResponse)
                        .collect(Collectors.toList());
            }
        }

        if (isTeacher) {
            List<User> associated = userRepository.findAssociatedLecturers(currentUser.getId());
            if (associated.isEmpty()) {
                associated = Collections.singletonList(currentUser);
            }
            return associated.stream().map(this::mapToUserResponse).collect(Collectors.toList());
        }

        return Collections.emptyList();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .active(user.isActive())
                .roles(user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
