package com.nexus.portal.service;
import com.nexus.portal.dto.request.AssessmentRequest;
import com.nexus.portal.dto.response.AssessmentResponse;
import java.util.List;
public interface AssessmentService {
    List<AssessmentResponse> getAssessments(Long assignmentId, String identifier);
    AssessmentResponse saveDraft(AssessmentRequest request, String identifier);
    AssessmentResponse submitAssessment(Long id, String identifier);
    void deleteDraft(Long id, String identifier);
}
