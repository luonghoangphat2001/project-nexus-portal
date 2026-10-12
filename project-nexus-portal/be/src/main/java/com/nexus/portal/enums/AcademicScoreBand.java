package com.nexus.portal.enums;

import java.math.BigDecimal;
import java.util.Arrays;

public enum AcademicScoreBand {
    BELOW_FIVE("0.00-4.99", new BigDecimal("0.00"), new BigDecimal("5.00")),
    FIVE_TO_SIX("5.00-5.99", new BigDecimal("5.00"), new BigDecimal("6.00")),
    SIX_TO_SEVEN("6.00-6.99", new BigDecimal("6.00"), new BigDecimal("7.00")),
    SEVEN_TO_EIGHT("7.00-7.99", new BigDecimal("7.00"), new BigDecimal("8.00")),
    EIGHT_TO_NINE("8.00-8.99", new BigDecimal("8.00"), new BigDecimal("9.00")),
    NINE_TO_TEN("9.00-10.00", new BigDecimal("9.00"), null);

    private final String label;
    private final BigDecimal lowerBound;
    private final BigDecimal upperBoundExclusive;

    AcademicScoreBand(String label, BigDecimal lowerBound, BigDecimal upperBoundExclusive) {
        this.label = label;
        this.lowerBound = lowerBound;
        this.upperBoundExclusive = upperBoundExclusive;
    }

    public String getLabel() {
        return label;
    }

    public static AcademicScoreBand forScore(BigDecimal score) {
        if (score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(new BigDecimal("10.00")) > 0) {
            throw new IllegalArgumentException("Score must be between 0 and 10");
        }
        return Arrays.stream(values())
                .filter(band -> score.compareTo(band.lowerBound) >= 0
                        && (band.upperBoundExclusive == null
                        || score.compareTo(band.upperBoundExclusive) < 0))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Score must be between 0 and 10"));
    }
}
