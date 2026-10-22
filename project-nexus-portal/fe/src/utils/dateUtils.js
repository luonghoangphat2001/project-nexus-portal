/**
 * Utility functions for Vietnam Timezone (UTC+7 / Asia/Ho_Chi_Minh)
 */

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const VIETNAM_LOCALE = 'vi-VN';

/**
 * Parses and normalizes any date representation (ISO string, MySQL timestamp,
 * millisecond epoch, Date object, or Jackson array [YYYY, MM, DD, HH, mm, ss])
 * into a valid JavaScript Date object, assuming UTC+7 if no timezone is specified.
 */
export function toVietnamDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  // Handle Jackson array format: [year, month, day, hour, minute, second]
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, min = 0, s = 0] = value;
    return new Date(y, m - 1, d, h, min, s);
  }

  // Handle numeric timestamp (epoch ms or seconds)
  if (typeof value === 'number') {
    return new Date(value < 10000000000 ? value * 1000 : value);
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Check if string already contains timezone information (e.g. 'Z', '+07:00', '-05:00')
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const hasTimezone = /Z$|[+-]\d{2}(:\d{2})?$/.test(normalized);

  // If missing timezone offset, explicitly anchor to Vietnam UTC+7
  const isoString = hasTimezone ? normalized : `${normalized}+07:00`;
  const d = new Date(isoString);

  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format as 'DD/MM/YYYY' in Vietnam timezone
 * @example '22/10/2026'
 */
export function formatDate(value, fallback = '—') {
  const d = toVietnamDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat(VIETNAM_LOCALE, {
    timeZone: VIETNAM_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format as 'HH:mm' in Vietnam timezone
 * @example '08:30'
 */
export function formatTime(value, fallback = '—') {
  const d = toVietnamDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat(VIETNAM_LOCALE, {
    timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Format as 'DD/MM/YYYY HH:mm' in Vietnam timezone
 * @example '22/10/2026 08:30'
 */
export function formatDateTime(value, fallback = '—') {
  const d = toVietnamDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat(VIETNAM_LOCALE, {
    timeZone: VIETNAM_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Format as 'DD/MM/YYYY HH:mm:ss' in Vietnam timezone
 * @example '22/10/2026 08:30:45'
 */
export function formatDateTimeFull(value, fallback = '—') {
  const d = toVietnamDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat(VIETNAM_LOCALE, {
    timeZone: VIETNAM_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
}
