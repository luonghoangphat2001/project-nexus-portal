package com.nexus.portal.service;

import com.nexus.portal.model.User;

import java.math.BigDecimal;

public record CalculatedScore(User student, AssessmentBreakdown advisor, AssessmentBreakdown reviewer,
                              AssessmentBreakdown defense, BigDecimal finalScore, boolean passed) {
    public record AssessmentBreakdown(BigDecimal score, BigDecimal contentScore,
                                      BigDecimal implementationScore, BigDecimal presentationScore,
                                      String evaluatorName, String comment) {}
}
