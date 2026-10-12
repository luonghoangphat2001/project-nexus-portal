import api from './api';

const finalResultService = {
  getAssignmentGrades: async (assignmentId) => (await api.get(`/results/assignments/${assignmentId}`)).data,
  publishAssignmentGrades: async (assignmentId) => (await api.post(`/results/assignments/${assignmentId}/publish`)).data,
  getMyPublishedGrades: async () => (await api.get('/results/me')).data,
};

export default finalResultService;
