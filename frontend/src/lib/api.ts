import axios from 'axios';
import { tokenManager } from '../features/auth/tokenManager';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Necessary to send and receive HTTP-Only cookies
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
        // Attempt to rotate the refresh token cookie
        await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        tokenManager.setIsRefreshing(false);
        tokenManager.onRefreshed();

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        tokenManager.clearSubscribers();

        // Force logout and redirect if refresh fails
        const { useAuthStore } = await import('../features/auth/store/authStore');
        useAuthStore.getState().logout();
        
        const publicPaths = ['/', '/signin', '/signup'];
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
