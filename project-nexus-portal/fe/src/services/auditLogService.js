import api from './api';

export const auditLogService = {
  getAuditLogs: (params = {}) => {
    const { page = 0, size = 20, username = '', action = '', status = '', sortBy = 'createdAt', direction = 'desc' } = params;
    const query = new URLSearchParams();
    query.append('page', page);
    query.append('size', size);
    query.append('sortBy', sortBy);
    query.append('direction', direction);
    if (username) query.append('username', username);
    if (action && action !== 'ALL') query.append('action', action);
    if (status && status !== 'ALL') query.append('status', status);

    return api.get(`/admin/audit-logs?${query.toString()}`);
  },

  getDistinctActions: () => {
    return api.get('/admin/audit-logs/actions');
  },

  exportAuditLogs: async (params = {}) => {
    const token = localStorage.getItem('nexus_auth_token');
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const query = new URLSearchParams();
    if (params.username) query.append('username', params.username);
    if (params.action && params.action !== 'ALL') query.append('action', params.action);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);

    const response = await fetch(`${apiBaseUrl}/admin/audit-logs/export?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to export audit logs');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};
