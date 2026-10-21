package com.nexus.portal.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexus.portal.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.DispatcherType;
import com.nexus.portal.controller.NotificationStreamController;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;
    private final ObjectMapper objectMapper;

    public SecurityConfig(CustomUserDetailsService customUserDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter,
                          CorsConfigurationSource corsConfigurationSource,
                          ObjectMapper objectMapper) {
        this.customUserDetailsService = customUserDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.corsConfigurationSource = corsConfigurationSource;
        this.objectMapper = objectMapper;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return new org.springframework.security.authentication.ProviderManager(authProvider);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            ErrorResponse error = ErrorResponse.builder()
                                    .success(false)
                                    .status(HttpStatus.UNAUTHORIZED.value())
                                    .error("Unauthorized")
                                    .message("Authentication required: Missing, invalid, or expired JWT access token. Please provide a valid 'Authorization: Bearer <token>' header.")
                                    .path(request.getRequestURI())
                                    .timestamp(LocalDateTime.now())
                                    .build();
                            objectMapper.writeValue(response.getOutputStream(), error);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            ErrorResponse error = ErrorResponse.builder()
                                    .success(false)
                                    .status(HttpStatus.FORBIDDEN.value())
                                    .error("Forbidden")
                                    .message("Access Denied (403 Forbidden): Your account does not have sufficient role permissions to perform this operation on this resource.")
                                    .path(request.getRequestURI())
                                    .timestamp(LocalDateTime.now())
                                    .build();
                            objectMapper.writeValue(response.getOutputStream(), error);
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // Permit only redispatches of an already authorized notification stream.
                        .requestMatchers(request ->
                                (request.getDispatcherType() == DispatcherType.ASYNC
                                        || request.getDispatcherType() == DispatcherType.ERROR)
                                && Boolean.TRUE.equals(request.getAttribute(
                                        NotificationStreamController.AUTHORIZED_STREAM_ATTRIBUTE))).permitAll()
                        // Group 1: Public Auth & Public Module APIs (wildcard ** covers all endpoints in the group)
                        .requestMatchers(
                                "/auth/**",
                                "/api/auth/**",
                                "/api/public/**",
                                "/academic/**",
                                "/api/academic/**"
                        ).permitAll()
                        // Group 2: Swagger & OpenAPI Documentation APIs
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/v3/api-docs",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger/**",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()
                        // Role-based protection for Period Creation & Management at filter level
                        .requestMatchers(HttpMethod.GET, "/periods", "/api/periods").hasAnyRole("ADMIN", "PRINCIPAL")
                        .requestMatchers(HttpMethod.POST, "/periods", "/api/periods").hasAnyRole("ADMIN", "PRINCIPAL")
                        .requestMatchers(HttpMethod.PUT, "/periods/**", "/api/periods/**").hasAnyRole("ADMIN", "PRINCIPAL")
                        .requestMatchers(HttpMethod.DELETE, "/periods/**", "/api/periods/**").hasRole("ADMIN")
                        // Admin Dashboard endpoints role enforcement
                        .requestMatchers("/dashboard/**", "/api/dashboard/**").hasRole("ADMIN")
                        // Admin system endpoints role enforcement
                        .requestMatchers("/admin/audit-logs/**", "/api/admin/audit-logs/**").hasRole("ADMIN")
                        .requestMatchers("/admin/**", "/api/admin/**").hasAnyRole("ADMIN", "PRINCIPAL")
                        // All other APIs require JWT authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
