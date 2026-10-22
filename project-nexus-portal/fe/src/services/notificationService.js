import api from './api';

export function localizeNotification(text, lang = 'vi') {
  if (!text) return '';
  const isEn = typeof lang === 'string' && lang.toLowerCase().startsWith('en');
  const clean = str => (str ? str.replace(/^\s*\[(VI|EN)\]\s*/i, '').trim() : '');

  // 1. Pipe format: "[VI] ... | [EN] ..." or "[EN] ... | [VI] ..."
  const viPipeEn = text.match(/\[VI\]\s*([\s\S]*?)\s*\|\s*\[EN\]\s*([\s\S]*)/i);
  if (viPipeEn) {
    const selected = isEn ? viPipeEn[2] : viPipeEn[1];
    if (clean(selected)) return clean(selected);
  }
  const enPipeVi = text.match(/\[EN\]\s*([\s\S]*?)\s*\|\s*\[VI\]\s*([\s\S]*)/i);
  if (enPipeVi) {
    const selected = isEn ? enPipeVi[1] : enPipeVi[2];
    if (clean(selected)) return clean(selected);
  }

  // 2. Block format: extract [VI] and [EN] sections
  const viMatch = text.match(/\[VI\]\s*([\s\S]*?)(?=(\n*\s*\[EN\]|$))/i);
  const enMatch = text.match(/\[EN\]\s*([\s\S]*?)(?=(\n*\s*\[VI\]|$))/i);

  if (isEn && enMatch && clean(enMatch[1])) {
    return clean(enMatch[1]);
  }
  if (!isEn && viMatch && clean(viMatch[1])) {
    return clean(viMatch[1]);
  }

  // Fallback if the requested language block is missing
  if (isEn && viMatch && clean(viMatch[1])) {
    return clean(viMatch[1]);
  }
  if (!isEn && enMatch && clean(enMatch[1])) {
    return clean(enMatch[1]);
  }

  // 3. Fallback: strip leading [VI] or [EN] tags
  return clean(text);
}

export const notificationService = {
  getAll: async () => (await api.get('/notifications')).data,
  create: async data => (await api.post('/notifications', data)).data,
  markRead: async id => (await api.put(`/notifications/${id}/read`)).data,
  delete: async id => (await api.delete(`/notifications/${id}`)).data,
};
