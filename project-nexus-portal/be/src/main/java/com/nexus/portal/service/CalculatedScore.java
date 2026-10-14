package com.nexus.portal.service;

import com.nexus.portal.model.User;

import java.math.BigDecimal;

public record CalculatedScore(User student, BigDecimal reviewScore, BigDecimal defenseScore,
                              BigDecimal finalScore, boolean passed) {}
