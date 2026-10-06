import api from './api';
export const progressService = {
  getTeams: async () => (await api.get('/progress/teams')).data,
  getTasks: async teamId => (await api.get(`/progress/teams/${teamId}/tasks`)).data,
  create: async (teamId, data) => (await api.post(`/progress/teams/${teamId}/tasks`, data)).data,
  update: async (teamId, id, data) => (await api.put(`/progress/teams/${teamId}/tasks/${id}`, data)).data,
  updateStatus: async (id, status) => (await api.put(`/progress/tasks/${id}/status`, { status })).data,
  review: async (id, feedback) => (await api.put(`/progress/tasks/${id}/feedback`, { feedback })).data,
  delete: async id => (await api.delete(`/progress/tasks/${id}`)).data,
};
