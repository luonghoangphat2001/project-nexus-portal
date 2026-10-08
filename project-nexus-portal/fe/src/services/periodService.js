import api from './api';
export const periodService = {
  getAll: async () => (await api.get('/periods')).data,
  create: async data => (await api.post('/periods', data)).data,
  update: async (id, data) => (await api.put(`/periods/${id}`, data)).data,
  delete: async id => (await api.delete(`/periods/${id}`)).data,
};
