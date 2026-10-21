package com.nexus.portal.controller;

import com.nexus.portal.dto.request.TopicCreateRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.enums.TopicStatus;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.User;
import com.nexus.portal.repository.UserRepository;
import com.nexus.portal.service.RegistrationPeriodService;
import com.nexus.portal.service.TopicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/topics")
@Tag(name = "Topic Management", description = "Endpoints for discovering, comparing, and managing thesis/capstone topics")
public class TopicController {

    private final TopicService topicService;
    private final RegistrationPeriodService registrationPeriodService;
    private final UserRepository userRepository;

    public TopicController(TopicService topicService,
                           RegistrationPeriodService registrationPeriodService,
                           UserRepository userRepository) {
        this.topicService = topicService;
        this.registrationPeriodService = registrationPeriodService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "Search topics", description = "Search and filter topics with pagination and multiple criteria")
    public ResponseEntity<ApiResponse<Page<TopicResponse>>> searchTopics(
            @Parameter(description = "Keywords in title or description") @RequestParam(required = false) String query,
            @Parameter(description = "Department ID filter") @RequestParam(required = false) Long departmentId,
            @Parameter(description = "Major ID filter") @RequestParam(required = false) Long majorId,
            @Parameter(description = "Lecturer ID filter") @RequestParam(required = false) Long lecturerId,
            @Parameter(description = "Status filter (OPEN, PENDING_APPROVAL, ASSIGNED, IN_PROGRESS, COMPLETED)") @RequestParam(required = false) TopicStatus status,
            @Parameter(description = "Registration Period ID filter") @RequestParam(required = false) Long periodId,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort direction (asc/desc)") @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by("id").ascending() : Sort.by("id").descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TopicResponse> topics = topicService.searchTopics(query, departmentId, majorId, lecturerId, status, periodId, pageable);
        return ResponseEntity.ok(ApiResponse.success(topics, "Topics retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get topic details", description = "Retrieve full details of a topic by its ID")
    public ResponseEntity<ApiResponse<TopicResponse>> getTopicById(
            @Parameter(description = "Topic ID", required = true) @PathVariable Long id) {
        TopicResponse topic = topicService.getTopicById(id);
        return ResponseEntity.ok(ApiResponse.success(topic, "Topic details retrieved"));
    }

    @GetMapping("/compare")
    @Operation(summary = "Compare topics", description = "Compare up to 3 topics side-by-side using comma-separated IDs (e.g., ?ids=1,2,3)")
    public ResponseEntity<ApiResponse<TopicCompareResponse>> compareTopics(
            @Parameter(description = "Comma-separated list of topic IDs (up to 3)", required = true) @RequestParam String ids) {

        List<Long> topicIds = Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toList());

        TopicCompareResponse comparison = topicService.compareTopics(topicIds);
        return ResponseEntity.ok(ApiResponse.success(comparison, "Topics comparison generated"));
    }

    @GetMapping("/periods/active")
    @Operation(summary = "Get active periods", description = "Retrieve list of all active registration periods")
    public ResponseEntity<ApiResponse<List<RegistrationPeriodResponse>>> getActivePeriods() {
        List<RegistrationPeriodResponse> periods = registrationPeriodService.getActive();
        return ResponseEntity.ok(ApiResponse.success(periods, "Registration periods retrieved"));
    }

    @GetMapping("/my-topics")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Get advisor or scoped topics", description = "Retrieve topics proposed by lecturer, scoped to department for department head, or all for admin")
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getMyTopics(Authentication authentication) {
        List<TopicResponse> topics = topicService.getTopicsByScope(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(topics, "Topics retrieved successfully"));
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Get department topics", description = "Retrieve topics within a specific department (enforces department scope for department heads)")
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getDepartmentTopics(
            @Parameter(description = "Department ID", required = true) @PathVariable Long departmentId,
            Authentication authentication) {
        List<TopicResponse> topics = topicService.getTopicsByDepartment(departmentId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(topics, "Department topics retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Create a topic", description = "Create a new topic with 1-2 advisors and targeted majors")
    public ResponseEntity<ApiResponse<TopicResponse>> createTopic(
            @Valid @RequestBody TopicCreateRequest request,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        TopicResponse created = topicService.createTopic(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(created, "Topic created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Update topic", description = "Update an existing topic proposal")
    public ResponseEntity<ApiResponse<TopicResponse>> updateTopic(
            @Parameter(description = "Topic ID", required = true) @PathVariable Long id,
            @Valid @RequestBody TopicCreateRequest request,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        TopicResponse updated = topicService.updateTopic(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Topic updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN') or hasRole('PRINCIPAL')")
    @Operation(summary = "Delete topic", description = "Delete a topic proposal")
    public ResponseEntity<ApiResponse<Void>> deleteTopic(
            @Parameter(description = "Topic ID", required = true) @PathVariable Long id,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        topicService.deleteTopic(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Topic deleted successfully"));
    }

    private User getCurrentUser(Authentication authentication) {
        String principalName = authentication.getName();
        return userRepository.findByEmail(principalName)
                .orElseGet(() -> userRepository.findByUsername(principalName)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + principalName)));
    }
}
