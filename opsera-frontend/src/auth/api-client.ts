/**
 * Axios API client with:
 * - CSRF header injection (WO-090)
 * - Correlation ID propagation
 * - 401 silent refresh interceptor (WO-065)
 */
import axios, { type AxiosError } from 'axios';

let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true, // send httpOnly cookies
  headers: {
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
    'Content-Type': 'application/json',
  },
});

// Inject correlation ID on every outgoing request
api.interceptors.request.use((config) => {
  config.headers['x-correlation-id'] ??= crypto.randomUUID();
  return config;
});

// Silent refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config;
    if (!original || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Don't retry auth endpoints themselves
    if (original.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((ok) => {
          if (ok) resolve(api(original));
          else reject(error);
        });
      });
    }

    isRefreshing = true;
    try {
      await api.post('/api/v1/auth/refresh');
      refreshQueue.forEach((cb) => cb(true));
      refreshQueue = [];
      return api(original);
    } catch {
      refreshQueue.forEach((cb) => cb(false));
      refreshQueue = [];
      window.location.href = '/auth/session-expired';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export { apiClient as api };
export default apiClient;
