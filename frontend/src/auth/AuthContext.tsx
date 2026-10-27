import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/endpoints';
import { setUnauthorizedHandler, tokenStore } from '../api/http';
import { decodeToken, isExpired, type SessionUser } from './jwt';

const EMAIL_KEY = 'catalog.email';

interface AuthState {
  user: SessionUser | null;
  email: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readSession(): SessionUser | null {
  const token = tokenStore.get();
  const user = token ? decodeToken(token) : null;
  if (!user || isExpired(user)) {
    tokenStore.clear();
    return null;
  }
  return user;
}

function readEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(readSession);
  const [email, setEmail] = useState<string | null>(readEmail);

  const logout = useCallback(() => {
    tokenStore.clear();
    try {
      localStorage.removeItem(EMAIL_KEY);
    } catch {
      return;
    } finally {
      setUser(null);
      setEmail(null);
      queryClient.clear();
    }
  }, [queryClient]);

  const login = useCallback(async (loginEmail: string, password: string) => {
    const { accessToken } = await api.auth.login(loginEmail, password);
    const decoded = decodeToken(accessToken);
    if (!decoded) throw new Error('Token inválido recebido da API');
    tokenStore.set(accessToken);
    try {
      localStorage.setItem(EMAIL_KEY, loginEmail);
    } catch {
      return;
    } finally {
      queryClient.clear();
      setUser(decoded);
      setEmail(loginEmail);
    }
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!user || user.expiresAt === 0) return;
    const timer = setTimeout(logout, Math.max(user.expiresAt - Date.now(), 0));
    return () => clearTimeout(timer);
  }, [user, logout]);

  const value = useMemo<AuthState>(
    () => ({ user, email, isAdmin: user?.role === 'ADMIN', login, logout }),
    [user, email, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
