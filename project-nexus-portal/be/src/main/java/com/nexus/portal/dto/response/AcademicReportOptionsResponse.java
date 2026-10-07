package com.nexus.portal.dto.response;

import java.util.List;

public record AcademicReportOptionsResponse(
        List<Option> periods,
        List<Option> departments,
        List<TopicOption> topics
) {
    public record Option(Long id, String name) {}
    public record TopicOption(Long id, String name, Long departmentId, Long periodId) {}
}
