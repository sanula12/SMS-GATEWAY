'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'reseller' | 'customer';
  status: string;
  creditBalance: string;
  phone?: string;
  timezone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children:  React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }

    // Verify session with the backend using the HttpOnly cookie
    api.get('/auth/me')
      .then((res) => {
        if (res.data) {
          setUser(res.data);
          localStorage.setItem('auth_user', JSON.stringify(res.data));
        }
      })
      .catch((e) => {
        console.warn('Session verification failed:', e.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback((_token: string, userData: AuthUser) => {
    // Token is now set by backend HttpOnly cookie, we just save the user object
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);

    const roleRoutes: Record<string, string> = {
      super_admin: '/admin',
      reseller: '/reseller',
      customer: '/dashboard',
    };
    router.push(roleRoutes[userData.role] ?? '/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed', e);
    }
    localStorage.removeItem('auth_user');
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const obh = useMemo(() => ({ user, isLoading, login, logout, updateUser }), [user, isLoading, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={obh}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}