import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TeamMember } from '../../../types/user';

export interface AuthState {
  user: TeamMember | null;
  token: string | null;
  isAuthenticated: boolean;
  isCheckingSession: boolean;
  loginTimestamp: number | null;
  rememberSession: boolean;
  login: (user: TeamMember, token: string, rememberMe: boolean) => void;
  logout: () => void;
  setUser: (user: TeamMember) => void;
  setCheckingSession: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isCheckingSession: true,
      loginTimestamp: null,
      rememberSession: false,
      login: (user: TeamMember, token: string, rememberSession: boolean) =>
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          loginTimestamp: Date.now(),
          rememberSession 
        }),
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        loginTimestamp: null,
        rememberSession: false
      }),
      setUser: (user: TeamMember) => set({ user }),
      setCheckingSession: (val: boolean) => set({ isCheckingSession: val }),
    }),
    {
      name: 'sprintos-auth-storage',
      // Persist only if rememberSession is true, else we could clear on mount if false.
    }
  )
);
