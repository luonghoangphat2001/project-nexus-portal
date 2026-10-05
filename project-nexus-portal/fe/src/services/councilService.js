import api from './api';

const councilService = {
  getCouncils: async () => (await api.get('/councils')).data,
  getOptions: async () => (await api.get('/councils/options')).data,
  createCouncil: async (data) => (await api.post('/councils', data)).data,
  updateCouncil: async (id, data) => (await api.put(`/councils/${id}`, data)).data,
  changeStatus: async (id, status) => (await api.patch(`/councils/${id}/status`, { status })).data,
  assignRegistration: async (id, registrationId) => (await api.post(`/councils/${id}/assignments`, { registrationId })).data,
  removeAssignment: async (id, assignmentId) => (await api.delete(`/councils/${id}/assignments/${assignmentId}`)).data,
};

export default councilService;
