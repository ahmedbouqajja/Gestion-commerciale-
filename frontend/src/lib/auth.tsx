'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api, setToken, clearToken, getToken } from './api';
import type { User, Quota } from './types';

interface AuthContextValue {
  user: User | null;
  quota: Quota | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  school?: string;
  subject?: string;
  level?: string;
  language?: 'fr' | 'ar';
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setQuota(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User; quota: Quota }>('/auth/me');
      setUser(res.user);
      setQuota(res.quota);
    } catch {
      clearToken();
      setUser(null);
      setQuota(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setToken(res.token);
    setUser(res.user);
    await refresh();
  };

  const register = async (data: RegisterData) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', data);
    setToken(res.token);
    setUser(res.user);
    await refresh();
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setQuota(null);
  };

  return (
    <AuthContext.Provider value={{ user, quota, loading, login, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
