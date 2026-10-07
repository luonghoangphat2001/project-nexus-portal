package com.nexus.portal.service.impl;

import com.nexus.portal.model.Assessment;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FinalGradeCalculatorTest {
    @Test
    void averagesThreeCriteriaAndAllSubmittedAssessments() {
        BigDecimal average = FinalGradeCalculator.average(List.of(
                assessment("10", "8", "6"),
                assessment("6", "8", "10")));

        assertEquals(new BigDecimal("8.00"), average);
    }

    @Test
    void appliesThirtySeventyWeightAndRoundsHalfUpToTwoDecimals() {
        BigDecimal finalScore = FinalGradeCalculator.finalScore(
                new BigDecimal("8.00"), new BigDecimal("7.50"));

        assertEquals(new BigDecimal("7.65"), finalScore);
    }

    @Test
    void treatsFiveAsPassingThreshold() {
        assertFalse(FinalGradeCalculator.passed(new BigDecimal("4.99")));
        assertTrue(FinalGradeCalculator.passed(new BigDecimal("5.00")));
    }

    private Assessment assessment(String content, String implementation, String presentation) {
        Assessment assessment = new Assessment();
        assessment.setContentScore(new BigDecimal(content));
        assessment.setImplementationScore(new BigDecimal(implementation));
        assessment.setPresentationScore(new BigDecimal(presentation));
        return assessment;
    }
}
