package com.nexus.portal.service;

import com.nexus.portal.dto.response.FinalGradeResponse;
import java.util.List;

public interface FinalResultService {
    List<FinalGradeResponse> getAssignmentGrades(Long assignmentId, String identifier);
    List<FinalGradeResponse> publishAssignmentGrades(Long assignmentId, String identifier);
    List<FinalGradeResponse> getMyPublishedGrades(String identifier);
}
