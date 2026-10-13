import api from './api';

const resultsService = {
  publishAssignmentResults: async (assignmentId) => (await api.post(`/results/assignments/${assignmentId}/publish`)).data,
  getMyPublishedResults: async () => (await api.get('/results/me')).data,
  getFilterOptions: async () => (await api.get('/results/reports/options')).data,
  getStatistics: async (params) => (await api.get('/results/reports', { params })).data,
  exportStatisticsCsv: async (params) => await api.get('/results/reports.csv', { params, responseType: 'blob' }),
};

export default resultsService;