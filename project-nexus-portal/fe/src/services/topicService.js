import api from './api';

export const topicService = {
  searchTopics: async (params = {}) => {
    const response = await api.get('/topics', { params });
    return response.data;
  },

  getTopicById: async (id) => {
    const response = await api.get(`/topics/${id}`);
    return response.data;
  },

  compareTopics: async (ids = []) => {
    const idsString = ids.join(',');
    const response = await api.get(`/topics/compare?ids=${idsString}`);
    return response.data;
  },

  getActivePeriods: async () => {
    const response = await api.get('/topics/periods/active');
    return response.data;
  },

  getMyLecturerTopics: async () => {
    const response = await api.get('/topics/my-topics');
    return response.data;
  },

  createTopic: async (topicData) => {
    const response = await api.post('/topics', topicData);
    return response.data;
  },

  updateTopic: async (id, topicData) => {
    const response = await api.put(`/topics/${id}`, topicData);
    return response.data;
  },

  deleteTopic: async (id) => {
    const response = await api.delete(`/topics/${id}`);
    return response.data;
  },

  exportTopicsExcel: async (params = {}) => {
    const response = await api.get('/topics/export.xlsx', { params, responseType: 'blob' });
    return response.data;
  },
};

export default topicService;
