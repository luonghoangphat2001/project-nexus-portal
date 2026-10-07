import api from './api';

const finalResultService = {
  getAssignmentGrades: async (assignmentId) => (await api.get(`/results/assignments/${assignmentId}`)).data,
  publishAssignmentGrades: async (assignmentId) => (await api.post(`/results/assignments/${assignmentId}/publish`)).data,
  getMyPublishedGrades: async () => (await api.get('/results/me')).data,
  getReportOptions: async () => (await api.get('/results/reports/options')).data,
  getAcademicReport: async (params) => (await api.get('/results/reports', { params })).data,
  exportAcademicReport: async (params) => await api.get('/results/reports.csv', { params, responseType: 'blob' }),
};

export default finalResultService;
