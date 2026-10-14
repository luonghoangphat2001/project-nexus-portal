package com.nexus.portal.service;

import com.nexus.portal.enums.ScoreRange;
import com.nexus.portal.service.ScoreCalculationService.ScoreRangeClassifier;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ScoreRangeClassifierTest {
    @Test
    void classifiesEveryScoreRangeAtItsBoundary() {
        assertEquals(ScoreRange.BELOW_FIVE, ScoreRangeClassifier.classify(new BigDecimal("4.99")));
        assertEquals(ScoreRange.FIVE_TO_SIX, ScoreRangeClassifier.classify(new BigDecimal("5.00")));
        assertEquals(ScoreRange.SIX_TO_SEVEN, ScoreRangeClassifier.classify(new BigDecimal("6.00")));
        assertEquals(ScoreRange.SEVEN_TO_EIGHT, ScoreRangeClassifier.classify(new BigDecimal("7.00")));
        assertEquals(ScoreRange.EIGHT_TO_NINE, ScoreRangeClassifier.classify(new BigDecimal("8.00")));
        assertEquals(ScoreRange.NINE_TO_TEN, ScoreRangeClassifier.classify(new BigDecimal("9.00")));
        assertEquals(ScoreRange.NINE_TO_TEN, ScoreRangeClassifier.classify(new BigDecimal("10.00")));
    }

    @Test
    void rejectsScoresOutsideTheScale() {
        assertThrows(IllegalArgumentException.class, () -> ScoreRangeClassifier.classify(new BigDecimal("10.01")));
        assertThrows(IllegalArgumentException.class, () -> ScoreRangeClassifier.classify(new BigDecimal("-0.01")));
    }

    @Test
    void labelsMatchTheDistributionKeysShownOnTheReportScreen() {
        assertEquals("0.00-4.99", ScoreRangeClassifier.labelOf(ScoreRange.BELOW_FIVE));
        assertEquals("9.00-10.00", ScoreRangeClassifier.labelOf(ScoreRange.NINE_TO_TEN));
    }
}
