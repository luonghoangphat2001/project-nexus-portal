import api from './api';

const scoreCalculationService = {
  getAssignmentScores: async (assignmentId) => (await api.get(`/results/assignments/${assignmentId}`)).data,
};

export default scoreCalculationService;
