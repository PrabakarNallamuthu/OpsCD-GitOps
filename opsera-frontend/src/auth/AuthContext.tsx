/**
 * WO-065: SSO Authentication Flow with OIDC Redirect
 * AuthContext — manages user identity, roles, and token lifecycle.
 * JWT stored in httpOnly cookie by the server; client never sees the token.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { api } from './api-client.js';

export type Role = 'Developer' | 'ReleaseManager' | 'SRE' | 'Leadership' | 'Auditor' | 'Admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  orgId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (...roles: Role[]) => boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_MARGIN_MS = 60 * 1000; // refresh 1 minute before 15-min JWT expiry
const TOKEN_TTL_MS = 15 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      const ok = await refreshSession();
      if (!ok) {
        setUser(null);
        window.location.href = '/auth/session-expired';
      }
    }, TOKEN_TTL_MS - REFRESH_MARGIN_MS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      await api.post('/api/v1/auth/refresh');
      scheduleRefresh();
      return true;
    } catch {
      return false;
    }
  }, [scheduleRefresh]);

  // Load current user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await api.get<AuthUser>('/api/v1/auth/me');
        setUser(data);
        scheduleRefresh();
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void loadUser();
    return () => clearTimeout(refreshTimerRef.current);
  }, [scheduleRefresh]);

  const login = useCallback(() => {
    // Generate PKCE and redirect to OIDC login
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    window.location.href = `/api/v1/auth/login?state=${state}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      clearTimeout(refreshTimerRef.current);
      setUser(null);
      window.location.href = '/auth/login';
    }
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      return roles.some((role) => user.roles.includes(role));
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        hasRole,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
