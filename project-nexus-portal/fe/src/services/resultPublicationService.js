import api from './api';

const resultPublicationService = {
  publishAssignmentResults: async (assignmentId) => (await api.post(`/results/assignments/${assignmentId}/publish`)).data,
  getMyPublishedResults: async () => (await api.get('/results/me')).data,
};

export default resultPublicationService;
