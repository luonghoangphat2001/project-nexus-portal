package com.nexus.portal.service;

import com.nexus.portal.dto.response.DefenseResultResponse;
import com.nexus.portal.model.DefenseAssignment;

import java.util.List;

public interface ScoreCalculationService {
    List<DefenseResultResponse> getAssignmentScores(Long assignmentId, String identifier);
    List<CalculatedScore> calculateScores(DefenseAssignment assignment);
}
