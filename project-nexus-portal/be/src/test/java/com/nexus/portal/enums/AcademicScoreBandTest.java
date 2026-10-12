package com.nexus.portal.enums;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AcademicScoreBandTest {
    @Test
    void classifiesEveryScoreBandAtItsLowerBoundary() {
        assertEquals(AcademicScoreBand.BELOW_FIVE, AcademicScoreBand.forScore(new BigDecimal("4.99")));
        assertEquals(AcademicScoreBand.FIVE_TO_SIX, AcademicScoreBand.forScore(new BigDecimal("5.00")));
        assertEquals(AcademicScoreBand.SIX_TO_SEVEN, AcademicScoreBand.forScore(new BigDecimal("6.00")));
        assertEquals(AcademicScoreBand.SEVEN_TO_EIGHT, AcademicScoreBand.forScore(new BigDecimal("7.00")));
        assertEquals(AcademicScoreBand.EIGHT_TO_NINE, AcademicScoreBand.forScore(new BigDecimal("8.00")));
        assertEquals(AcademicScoreBand.NINE_TO_TEN, AcademicScoreBand.forScore(new BigDecimal("9.00")));
        assertEquals(AcademicScoreBand.NINE_TO_TEN, AcademicScoreBand.forScore(new BigDecimal("10.00")));
        assertThrows(IllegalArgumentException.class,
                () -> AcademicScoreBand.forScore(new BigDecimal("10.01")));
        assertThrows(IllegalArgumentException.class,
                () -> AcademicScoreBand.forScore(new BigDecimal("-0.01")));
    }
}
