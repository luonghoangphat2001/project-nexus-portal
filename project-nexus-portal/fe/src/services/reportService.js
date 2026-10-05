import api from './api';

const reportService = {
  getRegistrations: async () => (await api.get('/reports/registrations')).data,
  getDocuments: async (id) => (await api.get(`/reports/registrations/${id}/documents`)).data,
  uploadDocument: async (id, values) => {
    const form = new FormData();
    form.append('type', values.type);
    form.append('title', values.title);
    form.append('note', values.note);
    form.append('file', values.file);
    return (await api.post(`/reports/registrations/${id}/documents`, form, {
      headers: { 'Content-Type': undefined }, timeout: 60000,
    })).data;
  },
  downloadDocument: async (id) => {
    const content = (await api.get(`/reports/documents/${id}/content`, { timeout: 60000 })).data;
    const bytes = Uint8Array.from(atob(content.base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: content.contentType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = content.fileName;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

export default reportService;
