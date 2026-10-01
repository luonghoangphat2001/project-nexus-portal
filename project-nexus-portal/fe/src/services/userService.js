import api from './api';

export const userService = {
  getAllUsers: (page = 0, size = 10, sortBy = 'id', direction = 'asc') => {
    return api.get(`/users?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`);
  },

  getUserById: (id) => {
    return api.get(`/users/${id}`);
  },

  createUser: (userData) => {
    return api.post('/users', userData);
  },

  updateUser: (id, userData) => {
    return api.put(`/users/${id}`, userData);
  },

  updateProfile: (profileData) => {
    return api.put('/users/profile', profileData);
  },

  updateRoles: (id, roles) => {
    return api.put(`/users/${id}/roles`, { roles });
  },

  resetPassword: (id, newPassword) => {
    return api.post(`/users/${id}/reset-password`, { newPassword });
  },

  toggleStatus: (id) => {
    return api.patch(`/users/${id}/toggle-status`);
  },

  deleteUser: (id) => {
    return api.delete(`/users/${id}`);
  },

  exportUsers: async () => {
    const token = localStorage.getItem('nexus_auth_token');
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/users/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to export user list');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};
