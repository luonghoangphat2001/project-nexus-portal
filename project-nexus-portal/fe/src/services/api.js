import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    'Missing required environment variable: VITE_API_BASE_URL. Please define it in fe/.env'
  );
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexus_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const lang = localStorage.getItem('nexus_lang') || 'vi';
    config.headers['Accept-Language'] = lang;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized Error & Token Expiration Handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      localStorage.removeItem('nexus_auth_token');
      localStorage.removeItem('nexus_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }

    const resData = error.response?.data;
    const message = resData?.message
      ? resData.message
      : resData?.error
      ? resData.error
      : error.message;

    const enrichedError = new Error(message);
    enrichedError.status = status;
    enrichedError.validationErrors = resData?.validationErrors;
    enrichedError.code = resData?.error;
    enrichedError.path = resData?.path;
    enrichedError.raw = error;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nexus:api_error', { detail: enrichedError })
      );
    }

    return Promise.reject(enrichedError);
  }
);

export default api;
