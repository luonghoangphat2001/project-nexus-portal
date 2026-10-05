package com.nexus.portal.dto.response;
import java.util.List;
public record CouncilOptionsResponse(List<Option> departments, List<Option> periods, List<Lecturer> lecturers) {
    public record Option(Long id, String name) {}
    public record Lecturer(Long id, String fullName, List<Long> departmentIds) {}
}
