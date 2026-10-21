import api from './api';

export const emailService = {
  getEmailStatus: async () => {
    const res = await api.get('/admin/email/status');
    return res.data;
  },

  sendTestEmail: async (recipient) => {
    const res = await api.post('/admin/email/test', { recipient });
    return res.data;
  },
};

export default emailService;
