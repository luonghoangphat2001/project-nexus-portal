import api from './api';
export const notificationService = {
  getAll: async () => (await api.get('/notifications')).data,
  create: async data => (await api.post('/notifications', data)).data,
  markRead: async id => (await api.put(`/notifications/${id}/read`)).data,
  delete: async id => (await api.delete(`/notifications/${id}`)).data,
};
