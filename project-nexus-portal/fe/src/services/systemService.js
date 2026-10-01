import api from './api';

export const systemService = {
  getSettings: () => {
    return api.get('/admin/settings');
  },

  getSettingByKey: (key) => {
    return api.get(`/admin/settings/${key}`);
  },

  updateSetting: (key, data) => {
    return api.put(`/admin/settings/${key}`, data);
  },

  getSystemMetrics: () => {
    return api.get('/admin/system/metrics');
  },
};
