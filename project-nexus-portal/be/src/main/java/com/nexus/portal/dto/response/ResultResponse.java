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
            BigDecimal advisorScore,
            BigDecimal reviewScore,
            BigDecimal defenseScore,
            BigDecimal advisorContentScore,
            BigDecimal advisorImplementationScore,
            BigDecimal advisorPresentationScore,
            BigDecimal reviewContentScore,
            BigDecimal reviewImplementationScore,
            BigDecimal reviewPresentationScore,
            BigDecimal defenseContentScore,
            BigDecimal defenseImplementationScore,
            BigDecimal defensePresentationScore,
            String advisorName,
            String advisorComment,
            String reviewComment,
            String defenseComments,
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

        public record DetailRow(
                String periodName, String departmentName, String topicTitle, String teamName,
                String studentCode, String studentName, String advisorName,
                BigDecimal advisorScore, BigDecimal advisorContentScore, BigDecimal advisorImplementationScore,
                BigDecimal advisorPresentationScore, BigDecimal reviewScore, BigDecimal reviewContentScore,
                BigDecimal reviewImplementationScore, BigDecimal reviewPresentationScore,
                BigDecimal defenseScore, BigDecimal defenseContentScore, BigDecimal defenseImplementationScore,
                BigDecimal defensePresentationScore, BigDecimal finalScore, boolean passed,
                String advisorComment, String reviewComment, String defenseComments
        ) {}
    }
}
