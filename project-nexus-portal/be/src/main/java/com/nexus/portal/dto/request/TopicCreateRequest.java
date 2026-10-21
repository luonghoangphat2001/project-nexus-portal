package com.nexus.portal.dto.request;

import com.nexus.portal.enums.TopicType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

@Schema(description = "Payload for creating or updating a thesis topic")
public class TopicCreateRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    @Schema(description = "Title of the thesis topic", example = "Real-time AI Code Scanner", requiredMode = Schema.RequiredMode.REQUIRED)
    private String title;

    @Schema(description = "Detailed description of the topic", example = "Automated scanner detecting OWASP vulnerabilities", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String description;

    @Schema(description = "Topic objectives", example = "Build high-throughput AST parser", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String objectives;

    @Schema(description = "Topic knowledge and skill requirements", example = "Spring Boot, Python, AST knowledge", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String requirements;

    @NotNull(message = "Department ID is required")
    @Schema(description = "Department managing this topic", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long departmentId;

    @NotNull(message = "Period ID is required")
    @Schema(description = "Registration period ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long periodId;

    @Schema(description = "Type of topic", example = "GRADUATION_THESIS", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private TopicType type = TopicType.CAPSTONE_PROJECT;

    @Schema(description = "Maximum number of students (1-3)", example = "3", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private Integer maxStudents = 3;

    @Schema(description = "Estimated project duration", example = "15 weeks", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String duration = "15 weeks";

    @Schema(description = "Optional Primary Advisor Lecturer User ID", example = "4", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private Long primaryAdvisorId;

    @Schema(description = "Optional Co-Advisor Lecturer User ID", example = "5", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private Long coAdvisorId;

    @Schema(description = "Major IDs applicable for this topic", example = "[1, 2]", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private Set<Long> majorIds;

    public TopicCreateRequest() {
    }

    public TopicCreateRequest(String title, String description, String objectives, String requirements,
                              Long departmentId, Long periodId, TopicType type, Integer maxStudents,
                              String duration, Long coAdvisorId, Set<Long> majorIds) {
        this.title = title;
        this.description = description;
        this.objectives = objectives;
        this.requirements = requirements;
        this.departmentId = departmentId;
        this.periodId = periodId;
        this.type = type != null ? type : TopicType.CAPSTONE_PROJECT;
        this.maxStudents = maxStudents != null ? maxStudents : 3;
        this.duration = duration;
        this.coAdvisorId = coAdvisorId;
        this.majorIds = majorIds;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getObjectives() {
        return objectives;
    }

    public void setObjectives(String objectives) {
        this.objectives = objectives;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public Long getPeriodId() {
        return periodId;
    }

    public void setPeriodId(Long periodId) {
        this.periodId = periodId;
    }

    public TopicType getType() {
        return type;
    }

    public void setType(TopicType type) {
        this.type = type;
    }

    public Integer getMaxStudents() {
        return maxStudents;
    }

    public void setMaxStudents(Integer maxStudents) {
        this.maxStudents = maxStudents;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public Long getPrimaryAdvisorId() {
        return primaryAdvisorId;
    }

    public void setPrimaryAdvisorId(Long primaryAdvisorId) {
        this.primaryAdvisorId = primaryAdvisorId;
    }

    public Long getCoAdvisorId() {
        return coAdvisorId;
    }

    public void setCoAdvisorId(Long coAdvisorId) {
        this.coAdvisorId = coAdvisorId;
    }

    public Set<Long> getMajorIds() {
        return majorIds;
    }

    public void setMajorIds(Set<Long> majorIds) {
        this.majorIds = majorIds;
    }
}
