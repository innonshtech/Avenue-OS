import axios from 'axios';
import { tokenManager } from '../features/auth/tokenManager';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Necessary to send and receive HTTP-Only cookies
});

api.interceptors.request.use((config) => {
  // Try to dynamically import useAuthStore to avoid circular dependency issues
  // or just read from localStorage directly if preferred, but since it's a zustand store we can read it
  try {
    const authStorage = localStorage.getItem('sprintos-auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const token = parsed?.state?.token;
      if (token && token !== 'cookie-token' && token !== 'sprintos-cookie-token') {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (e) {}
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) and has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if refresh or login itself is failing
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If a refresh is already in progress, queue this request
      if (tokenManager.getIsRefreshing()) {
        return new Promise((resolve) => {
          tokenManager.subscribe(() => {
            resolve(api(originalRequest));
          });
        });
      }

      tokenManager.setIsRefreshing(true);

      try {
        // Attempt to rotate the refresh token
        let refreshTokenBody = {};
        try {
          const authStorage = localStorage.getItem('sprintos-auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            if (parsed?.state?.refreshToken) {
              refreshTokenBody = { refreshToken: parsed.state.refreshToken };
            }
          }
        } catch (e) {}

        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          refreshTokenBody,
          { withCredentials: true }
        );

        if (refreshResponse.data?.accessToken) {
          const { useAuthStore } = await import('../features/auth/store/authStore');
          const currentStore = useAuthStore.getState();
          if (currentStore.user) {
            currentStore.login(
              currentStore.user, 
              refreshResponse.data.accessToken, 
              refreshResponse.data.refreshToken || null, 
              currentStore.rememberSession
            );
          }
        }

        tokenManager.setIsRefreshing(false);
        tokenManager.onRefreshed();

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        tokenManager.clearSubscribers();

        // Force logout and redirect if refresh fails
        const { useAuthStore } = await import('../features/auth/store/authStore');
        useAuthStore.getState().logout();
        
        const publicPaths = ['/', '/signin', '/signup', '/forgot-password', '/reset-password'];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/signin';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
