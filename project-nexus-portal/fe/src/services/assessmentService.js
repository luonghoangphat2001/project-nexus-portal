import api from './api';

const assessmentService = {
  getAssessments: async (assignmentId) => (await api.get('/assessments', { params: { assignmentId } })).data,
  saveDraft: async (data) => (await api.post('/assessments', data)).data,
  submitAssessment: async (id) => (await api.post(`/assessments/${id}/submit`)).data,
  deleteDraft: async (id) => (await api.delete(`/assessments/${id}`)).data,
};

export default assessmentService;
