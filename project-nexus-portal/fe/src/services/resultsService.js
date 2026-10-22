import api from './api';

const resultsService = {
  getAssignmentScores: async (assignmentId) => (await api.get(`/results/assignments/${assignmentId}`)).data,
  publishAssignmentResults: async (assignmentId) => (await api.post(`/results/assignments/${assignmentId}/publish`)).data,
  republishAssignmentResults: async (assignmentId, reason) =>
    (await api.post(`/results/assignments/${assignmentId}/republish`, null, { params: reason ? { reason } : {} })).data,
  adjustPublishedResult: async (assignmentId, studentId, scores, reason) =>
    (await api.post(`/results/assignments/${assignmentId}/adjust`, null, {
      params: {
        studentId,
        reason,
        ...(scores.advisorScore != null ? { advisorScore: scores.advisorScore } : {}),
        ...(scores.reviewScore != null ? { reviewScore: scores.reviewScore } : {}),
        ...(scores.defenseScore != null ? { defenseScore: scores.defenseScore } : {}),
      },
    })).data,
  publishPeriodResults: async (periodId) => (await api.post(`/results/periods/${periodId}/publish`)).data,
  getMyPublishedResults: async () => (await api.get('/results/me')).data,
  getFilterOptions: async () => (await api.get('/results/reports/options')).data,
  getStatistics: async (params) => (await api.get('/results/reports', { params })).data,
  // The api response interceptor already unwraps response.data, so a blob request resolves to the Blob itself.
  exportDetailedReportExcel: async (params) => api.get('/results/reports.xlsx', { params, responseType: 'blob' }),
};

export default resultsService;