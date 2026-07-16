import axios from 'axios';

// In production the backend URL MUST be injected via VITE_API_URL (Vercel env var).
// NEVER fall back to localhost in a production build — that produces an unreachable
// API and an infinite 401 → reload loop. In dev we keep localhost for convenience.
const isProd = import.meta.env.PROD;
const API_BASE_URL = import.meta.env.VITE_API_URL
  || (isProd ? '' : 'http://localhost:5000/api/v1');

if (!import.meta.env.VITE_API_URL) {
  console.warn(
    '[Society Portal] VITE_API_URL is not set. ' +
    (isProd
      ? 'Production build will be unable to reach the backend. Set VITE_API_URL in Vercel Environment Variables to your deployed backend URL.'
      : 'API requests will target localhost:5000 (dev default).')
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
  timeout: 4000, // 4-second request timeout to prevent hanging loaders
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

// Guard to prevent infinite redirect loops on repeated 401s
let isRedirectingToLogin = false;

// Response interceptor to handle token expiry / unauthenticated requests.
// IMPORTANT: we use SPA navigation (history.replaceState), NOT window.location.href,
// to avoid a full-page reload loop when the backend is unreachable (e.g. wrong VITE_API_URL).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');

      const isOnLogin = window.location.pathname.includes('/login');
      if (!isOnLogin && !isRedirectingToLogin) {
        isRedirectingToLogin = true;
        // SPA navigation — no full reload — prevents the infinite reload glitch
        window.history.replaceState(null, '', '/login');
        // Reset guard after a moment so a later genuine 401 can still redirect
        setTimeout(() => { isRedirectingToLogin = false; }, 2000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
