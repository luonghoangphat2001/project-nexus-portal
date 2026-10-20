import api from './api';

const resultsService = {
  getAssignmentScores: async (assignmentId) => (await api.get(`/results/assignments/${assignmentId}`)).data,
  publishAssignmentResults: async (assignmentId) => (await api.post(`/results/assignments/${assignmentId}/publish`)).data,
  publishPeriodResults: async (periodId) => (await api.post(`/results/periods/${periodId}/publish`)).data,
  getMyPublishedResults: async () => (await api.get('/results/me')).data,
  getFilterOptions: async () => (await api.get('/results/reports/options')).data,
  getStatistics: async (params) => (await api.get('/results/reports', { params })).data,
  exportDetailedReportExcel: async (params) => (await api.get('/results/reports.xlsx', { params, responseType: 'blob' })).data,
};

export default resultsService;