/**
 * Keycloak OIDC Auth Hook — КЛГ АСУ ТК.
 * Handles token lifecycle: login, refresh, logout.
 * Falls back to DEV mode when OIDC issuer is not configured.
 * 
 * Production: set NEXT_PUBLIC_OIDC_ISSUER=http://keycloak:8180/realms/klg
 */
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

interface OIDCConfig {
  issuer: string;
  clientId: string;
  redirectUri: string;
}

interface TokenSet {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

interface OIDCUser {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  realm_access?: { roles: string[] };
  organization_id?: string;
}

const DEFAULT_CONFIG: OIDCConfig = {
  issuer: process.env.NEXT_PUBLIC_OIDC_ISSUER || '',
  clientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || 'klg-frontend',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/callback` : '',
};

function parseJwt(token: string): OIDCUser | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
}

export function useOIDCAuth(config: Partial<OIDCConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const isOIDC = !!cfg.issuer;

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<OIDCUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<NodeJS.Timeout>();

  // Parse well-known config
  const getEndpoints = useCallback(async () => {
    if (!isOIDC) return null;
    const res = await fetch(`${cfg.issuer}/.well-known/openid-configuration`);
    return res.json();
  }, [cfg.issuer, isOIDC]);

  // Token exchange
  const exchangeCode = useCallback(async (code: string) => {
    const endpoints = await getEndpoints();
    if (!endpoints) return;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: cfg.clientId,
      code,
      redirect_uri: cfg.redirectUri,
    });

    const res = await fetch(endpoints.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const tokens: TokenSet = await res.json();
    if (tokens.access_token) {
      setToken(tokens.access_token);
      setUser(parseJwt(tokens.access_token));
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('klg_access_token', tokens.access_token);
        if (tokens.refresh_token) sessionStorage.setItem('klg_refresh_token', tokens.refresh_token);
      }
      // Schedule refresh
      if (tokens.expires_in && tokens.refresh_token) {
        const refreshIn = (tokens.expires_in - 60) * 1000; // 60s before expiry
        refreshTimer.current = setTimeout(() => refreshToken(tokens.refresh_token!), refreshIn);
      }
    }
  }, [cfg, getEndpoints]);

  // Refresh token
  const refreshToken = useCallback(async (rt: string) => {
    const endpoints = await getEndpoints();
    if (!endpoints) return;

    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: cfg.clientId,
        refresh_token: rt,
      });

      const res = await fetch(endpoints.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const tokens: TokenSet = await res.json();
      if (tokens.access_token) {
        setToken(tokens.access_token);
        setUser(parseJwt(tokens.access_token));
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('klg_access_token', tokens.access_token);
          if (tokens.refresh_token) sessionStorage.setItem('klg_refresh_token', tokens.refresh_token);
        }
        if (tokens.expires_in && tokens.refresh_token) {
          refreshTimer.current = setTimeout(() => refreshToken(tokens.refresh_token!), (tokens.expires_in - 60) * 1000);
        }
      }
    } catch (e) {
      console.error('Token refresh failed:', e);
      logout();
    }
  }, [cfg, getEndpoints]);

  // Login redirect
  const login = useCallback(async () => {
    if (!isOIDC) return;
    const endpoints = await getEndpoints();
    if (!endpoints) return;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      scope: 'openid profile email',
    });

    window.location.href = `${endpoints.authorization_endpoint}?${params}`;
  }, [cfg, getEndpoints, isOIDC]);

  // Logout
  const logout = useCallback(async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setToken(null);
    setUser(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('klg_access_token');
      sessionStorage.removeItem('klg_refresh_token');
    }

    if (isOIDC) {
      const endpoints = await getEndpoints();
      if (endpoints?.end_session_endpoint) {
        window.location.href = `${endpoints.end_session_endpoint}?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
        return;
      }
    }

    window.location.href = '/login';
  }, [getEndpoints, isOIDC]);

  // Init: check for auth code or existing token
  useEffect(() => {
    const init = async () => {
      // Check for OIDC callback
      if (isOIDC && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          await exchangeCode(code);
          window.history.replaceState({}, '', window.location.pathname);
          setLoading(false);
          return;
        }
      }

      // Check session storage
      if (typeof sessionStorage !== 'undefined') {
        const saved = sessionStorage.getItem('klg_access_token');
        if (saved) {
          const parsed = parseJwt(saved);
          if (parsed) {
            setToken(saved);
            setUser(parsed);
          }
        }
      }

      setLoading(false);
    };

    init();
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, [exchangeCode, isOIDC]);

  return {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    isOIDC,
    login,
    logout,
    roles: user?.realm_access?.roles || [],
    organizationId: user?.organization_id,
  };
}
