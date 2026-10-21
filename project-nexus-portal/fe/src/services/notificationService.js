import api from './api';

export function localizeNotification(text, lang = 'vi') {
  if (!text) return '';
  const isEn = lang === 'en';

  // Check if title has "[VI] ... | [EN] ..."
  const titlePipeMatch = text.match(/\[VI\]\s*([\s\S]*?)\s*\|\s*\[EN\]\s*([\s\S]*)/i);
  if (titlePipeMatch) {
    return isEn ? titlePipeMatch[2].trim() : titlePipeMatch[1].trim();
  }

  // Check if content has [VI] and [EN] tags
  const viMatch = text.match(/\[VI\]\s*([\s\S]*?)(?=(\n*\[EN\]|$))/i);
  const enMatch = text.match(/\[EN\]\s*([\s\S]*?)(?=(\n*\[VI\]|$))/i);
  if (viMatch && enMatch) {
    return isEn ? enMatch[1].trim() : viMatch[1].trim();
  }

  return text;
}

export const notificationService = {
  getAll: async () => (await api.get('/notifications')).data,
  create: async data => (await api.post('/notifications', data)).data,
  markRead: async id => (await api.put(`/notifications/${id}/read`)).data,
  delete: async id => (await api.delete(`/notifications/${id}`)).data,
};
