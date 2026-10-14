package com.nexus.portal.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class ResultResponse {
    private ResultResponse() {}

    public record Defense(
            Long assignmentId,
            Long registrationId,
            Long periodId,
            String periodName,
            Long departmentId,
            String departmentName,
            Long topicId,
            String topicTitle,
            String teamName,
            Long studentId,
            String studentName,
            String studentCode,
            BigDecimal reviewScore,
            BigDecimal defenseScore,
            BigDecimal finalScore,
            boolean passed,
            boolean published,
            LocalDateTime publishedAt
    ) {}

    public static final class Statistics {
        private Statistics() {}

        public record Options(List<Option> periods, List<Option> departments, List<TopicOption> topics) {
            public record Option(Long id, String name) {}
            public record TopicOption(Long id, String name, Long departmentId, Long periodId) {}
        }

        public record Row(
                Long periodId,
                String periodName,
                Long departmentId,
                String departmentName,
                Long topicId,
                String topicTitle,
                long studentCount,
                BigDecimal averageFinalScore,
                long passCount,
                long failCount,
                Map<String, Long> scoreDistribution
        ) {}
    }
}
