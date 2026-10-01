package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.ChangePasswordRequest;
import com.nexus.portal.dto.request.LoginRequest;
import com.nexus.portal.dto.request.RegisterRequest;
import com.nexus.portal.dto.response.AuthResponse;
import com.nexus.portal.dto.response.UserResponse;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.Role;
import com.nexus.portal.model.User;
import com.nexus.portal.repository.RoleRepository;
import com.nexus.portal.repository.UserRepository;
import com.nexus.portal.security.JwtTokenProvider;
import com.nexus.portal.security.UserPrincipal;
import com.nexus.portal.service.AuditLogService;
import com.nexus.portal.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider,
                           AuditLogService auditLogService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditLogService = auditLogService;
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsernameOrEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

            auditLogService.log(user.getId(), user.getUsername(), "AUTH_LOGIN_SUCCESS", "Auth",
                    "User logged in successfully", "127.0.0.1", "NexusPortal", "SUCCESS");

            return AuthResponse.builder()
                    .accessToken(jwt)
                    .tokenType("Bearer")
                    .expiresIn(tokenProvider.getExpirationMs())
                    .user(mapToUserResponse(user))
                    .build();
        } catch (BadCredentialsException ex) {
            auditLogService.log(null, loginRequest.getUsernameOrEmail(), "AUTH_LOGIN_FAILED", "Auth",
                    "Login failed: Invalid username or password", "127.0.0.1", "NexusPortal", "FAILED");
            throw new BadRequestException("Invalid username or password!");
        } catch (Exception ex) {
            auditLogService.log(null, loginRequest.getUsernameOrEmail(), "AUTH_LOGIN_ERROR", "Auth",
                    "Login error: " + ex.getMessage(), "127.0.0.1", "NexusPortal", "FAILED");
            throw ex;
        }
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new BadRequestException("Username is already taken!");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new BadRequestException("Email is already in use!");
        }

        Set<Role> roles = new HashSet<>();
        Set<RoleName> requestedRoles = registerRequest.getRoles();

        if (requestedRoles == null || requestedRoles.isEmpty()) {
            Role defaultRole = roleRepository.findByName(RoleName.ROLE_USER)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "name", RoleName.ROLE_USER));
            roles.add(defaultRole);
        } else {
            for (RoleName roleName : requestedRoles) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName));
                roles.add(role);
            }
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .fullName(registerRequest.getFullName())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .active(true)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        auditLogService.log(savedUser.getId(), savedUser.getUsername(), "AUTH_REGISTER", "User",
                "New user account registered successfully", "127.0.0.1", "NexusPortal", "SUCCESS");

        return mapToUserResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new BadRequestException("No authenticated user found in security context");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirmation password do not match!");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            auditLogService.log(user.getId(), username, "AUTH_CHANGE_PASSWORD_FAILED", "User",
                    "Password change failed: Current password is incorrect", "127.0.0.1", "NexusPortal", "FAILED");
            throw new BadRequestException("Current password is incorrect!");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password cannot be the same as current password!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditLogService.log(user.getId(), username, "AUTH_CHANGE_PASSWORD_SUCCESS", "User",
                "Password changed successfully", "127.0.0.1", "NexusPortal", "SUCCESS");
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
}
