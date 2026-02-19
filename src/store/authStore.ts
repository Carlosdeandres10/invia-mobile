/**
 * Auth Store — Manages authentication state with Zustand
 */
import { create } from 'zustand';
import { apiClient, type AuthStatus, type LoginResponse } from '../api/client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: string | null;
  role: string | null;
  error: string | null;

  checkAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  role: null,
  error: null,

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const status: AuthStatus = await apiClient.getAuthStatus();
      set({
        isAuthenticated: status.authenticated,
        user: status.user || null,
        role: status.role || null,
        isLoading: false,
      });
    } catch {
      set({
        isAuthenticated: false,
        user: null,
        role: null,
        isLoading: false,
      });
    }
  },

  login: async (username: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const result: LoginResponse = await apiClient.login(username, password);
      if (result.ok) {
        set({
          isAuthenticated: true,
          user: result.user || username,
          role: result.role || null,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
          error: result.error || 'Credenciales incorrectas',
        });
        return false;
      }
    } catch (err: any) {
      set({
        isAuthenticated: false,
        isLoading: false,
        error: err?.message || 'Error de conexión',
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignore logout errors
    }
    set({
      isAuthenticated: false,
      user: null,
      role: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
