import { useAuthStore } from './store/authStore';
import { AuthApi } from './authApi';

export class SessionManager {
  static async checkSession() {
    try {
      const data = await AuthApi.getMe();
      if (data.success && data.user) {
        useAuthStore.getState().login(data.user, 'cookie-token', true); // cookie-token is a placeholder token representation for backward compatibility
        return data.user;
      }
    } catch (error) {
      useAuthStore.getState().logout();
    }
    return null;
  }

  static async performLogout() {
    try {
      await AuthApi.logout();
    } catch (err) {
      // Continue even if server logout fails
    } finally {
      useAuthStore.getState().logout();
      window.location.href = '/signin';
    }
  }
}
