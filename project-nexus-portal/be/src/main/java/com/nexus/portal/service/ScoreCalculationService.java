package com.nexus.portal.service;

import com.nexus.portal.dto.response.ResultResponse;
import com.nexus.portal.enums.ScoreRange;
import com.nexus.portal.model.DefenseAssignment;

import java.math.BigDecimal;
import java.util.List;

public interface ScoreCalculationService {
    List<ResultResponse.Defense> getAssignmentScores(Long assignmentId, String identifier);
    List<CalculatedScore> calculateScores(DefenseAssignment assignment);

    final class ScoreRangeClassifier {
        private static final BigDecimal MIN_SCORE = BigDecimal.ZERO;
        private static final BigDecimal MAX_SCORE = new BigDecimal("10.00");

        private ScoreRangeClassifier() {}

        public static ScoreRange classify(BigDecimal score) {
            if (score.compareTo(MIN_SCORE) < 0 || score.compareTo(MAX_SCORE) > 0) {
                throw new IllegalArgumentException("Score must be between 0 and 10");
            }
            if (isBelow(score, "5.00")) return ScoreRange.BELOW_FIVE;
            if (isBelow(score, "6.00")) return ScoreRange.FIVE_TO_SIX;
            if (isBelow(score, "7.00")) return ScoreRange.SIX_TO_SEVEN;
            if (isBelow(score, "8.00")) return ScoreRange.SEVEN_TO_EIGHT;
            if (isBelow(score, "9.00")) return ScoreRange.EIGHT_TO_NINE;
            return ScoreRange.NINE_TO_TEN;
        }

        public static String labelOf(ScoreRange range) {
            return switch (range) {
                case BELOW_FIVE -> "0.00-4.99";
                case FIVE_TO_SIX -> "5.00-5.99";
                case SIX_TO_SEVEN -> "6.00-6.99";
                case SEVEN_TO_EIGHT -> "7.00-7.99";
                case EIGHT_TO_NINE -> "8.00-8.99";
                case NINE_TO_TEN -> "9.00-10.00";
            };
        }

        private static boolean isBelow(BigDecimal score, String upperBound) {
            return score.compareTo(new BigDecimal(upperBound)) < 0;
        }
    }
}
