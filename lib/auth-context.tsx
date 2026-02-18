/**
 * Auth context provider for КЛГ АСУ ТК.
 * Fallback на demo-пользователей при недоступности бэкенда.
 */
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { setAuthToken, getAuthToken, clearAuthToken, usersApi } from '@/lib/api/api-client';
import { wsClient } from '@/lib/ws-client';

export type UserRole = 'admin' | 'authority_inspector' | 'favt_inspector' | 'operator_manager' | 'operator_user' | 'mro_manager' | 'mro_user';

export interface AuthUser {
  id: string;
  display_name: string;
  email: string | null;
  role: UserRole;
  organization_id: string | null;
  organization_name: string | null;
}

const DEMO_USERS: Record<string, AuthUser> = {
  dev: { id: 'demo-dev', display_name: 'Разработчик', email: 'dev@local', role: 'admin', organization_id: null, organization_name: 'Локальная разработка' },
  'demo-admin': { id: 'demo-admin', display_name: 'Администратор', email: 'admin@demo', role: 'admin', organization_id: null, organization_name: 'Демо' },
  'demo-inspector': { id: 'demo-inspector', display_name: 'Инспектор', email: 'inspector@demo', role: 'authority_inspector', organization_id: null, organization_name: 'ФАВТ' },
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuthority: boolean;
  isOperator: boolean;
  isMRO: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
  isAuthority: false,
  isOperator: false,
  isMRO: false,
  hasRole: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getAuthToken();
    try {
      const me = await usersApi.me();
      setUser(me as AuthUser);
      wsClient.connect(me.id, me.organization_id || undefined);
    } catch {
      if (token && DEMO_USERS[token]) {
        setUser(DEMO_USERS[token]);
      } else {
        setUser(null);
        clearAuthToken();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
    return () => { wsClient.disconnect(); };
  }, [fetchUser]);

  const login = async (token: string) => {
    setAuthToken(token);
    await fetchUser();
  };

  const logout = () => {
    clearAuthToken();
    wsClient.disconnect();
    setUser(null);
  };

  const role = user?.role || '';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: role === 'admin',
      isAuthority: role === 'admin' || role === 'authority_inspector' || role === 'favt_inspector',
      isOperator: role.startsWith('operator'),
      isMRO: role.startsWith('mro'),
      hasRole: (...roles) => roles.includes(role as UserRole),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireRole({ roles, children, fallback }: {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasRole, loading } = useAuth();
  if (loading) return null;
  if (!hasRole(...roles)) return fallback ? <>{fallback}</> : null;
  return <>{children}</>;
}
