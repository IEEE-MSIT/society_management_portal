import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Warn in production if using localhost fallback
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn(
    '[Society Portal] VITE_API_URL is not set — API requests will target localhost and will fail. ' +
    'Set VITE_API_URL in Vercel Environment Variables to your deployed backend URL.'
  );
}

/**
 * Derive the Socket.IO server URL from the API base URL.
 * E.g. "https://api.example.com/api/v1" → "https://api.example.com"
 *      "http://localhost:5000/api/v1"    → "http://localhost:5000"
 */
export const getSocketUrl = (): string => {
  try {
    const url = new URL(API_BASE_URL);
    return url.origin;
  } catch {
    // Fallback: strip the path portion
    return API_BASE_URL.replace(/\/api\/v1\/?$/, '') || 'http://localhost:5000';
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauthenticated requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect if unauthorized
      localStorage.removeItem('auth_token');
      // Only redirect if not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
