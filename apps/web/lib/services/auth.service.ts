import Cookies from 'js-cookie';
import api from '../api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
}

export const AuthService = {
  login: async (payload: LoginPayload) => {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    }
    window.location.href = '/login';
  },

  // These methods are deprecated as tokens are now HttpOnly, but kept for compatibility checks
  getToken: () => null,
  isLoggedIn: () => false,
};