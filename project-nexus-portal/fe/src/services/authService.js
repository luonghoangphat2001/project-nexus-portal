import api from './api';

export const authService = {
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  getMe: () => {
    return api.get('/auth/me');
  },

  changePassword: (passwordData) => {
    return api.post('/auth/change-password', passwordData);
  },
};
