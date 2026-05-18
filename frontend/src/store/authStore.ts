import { create } from 'zustand';
import {
  AuthUser,
  loginRequest,
  logoutRequest,
  getMeRequest,
  registerRequest,
} from '../services/authService.ts';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: 'guest' | 'host';
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (email, password) => {
    const { data } = await loginRequest({ email, password });
    set({ user: data });
  },

  register: async (formData) => {
    const { data } = await registerRequest(formData);
    set({ user: data });
  },

  logout: async () => {
    await logoutRequest();
    set({ user: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await getMeRequest();
      set({ user: data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));

export default useAuthStore;
