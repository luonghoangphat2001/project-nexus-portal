package com.nexus.portal.service.impl;

import com.nexus.portal.model.Assessment;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

final class FinalGradeCalculator {
    static final BigDecimal REVIEW_WEIGHT = new BigDecimal("0.30");
    static final BigDecimal DEFENSE_WEIGHT = new BigDecimal("0.70");
    static final BigDecimal PASSING_SCORE = new BigDecimal("5.00");

    private FinalGradeCalculator() {}

    static BigDecimal average(List<Assessment> assessments) {
        BigDecimal sum = assessments.stream()
                .map(a -> a.getContentScore()
                        .add(a.getImplementationScore())
                        .add(a.getPresentationScore())
                        .divide(BigDecimal.valueOf(3), 8, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(assessments.size()), 2, RoundingMode.HALF_UP);
    }

    static BigDecimal finalScore(BigDecimal reviewScore, BigDecimal defenseScore) {
        return reviewScore.multiply(REVIEW_WEIGHT)
                .add(defenseScore.multiply(DEFENSE_WEIGHT))
                .setScale(2, RoundingMode.HALF_UP);
    }

    static boolean passed(BigDecimal finalScore) {
        return finalScore.compareTo(PASSING_SCORE) >= 0;
    }
}
