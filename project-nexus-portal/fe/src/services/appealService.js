import api from './api';

export const appealService = {
  submitAppeal: async (assignmentId, data) => (await api.post(`/appeals/assignments/${assignmentId}`, data)).data,
  getMyAppeals: async () => (await api.get('/appeals/me')).data,
  getAppeals: async (params) => (await api.get('/appeals', { params })).data,
  updateAppealStatus: async (id, data) => (await api.patch(`/appeals/${id}/status`, data)).data,
};

export default appealService;

