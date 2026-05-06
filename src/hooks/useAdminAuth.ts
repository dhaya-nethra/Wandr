/**
 * Admin authentication hook for NATPAC researchers & government administrators.
 *
 * Role hierarchy:
 *   ADMIN       – Full access, can manage other admins, view raw data
 *   RESEARCHER  – Anonymised/aggregated data only; no raw participant IDs
 *
 * Session is stored in sessionStorage (cleared when browser tab closes).
 * Credentials are never stored; the government master key is held in memory only.
 */

import { createContext, createElement, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { sha256Hex } from '@/lib/crypto';
import { appendAdminAudit, loginAdmin } from '@/lib/backendApi';

export type AdminRole = 'ADMIN' | 'RESEARCHER';

export interface AdminSession {
  adminId: string;          // username (plain, in-memory only)
  role: AdminRole;
  govMasterKey: string;     // held in memory only — never persisted
  loginTime: string;
  expiresAt: string;        // 8-hour sessions
}

type SessionMeta = {
  adminId: string;
  role: AdminRole;
  loginTime: string;
  expiresAt: string;
};

interface AdminAuthContextValue {
  session: AdminSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string, govKey: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function normalizeRole(role: string): AdminRole {
  return role === 'RESEARCHER' ? 'RESEARCHER' : 'ADMIN';
}

const SESSION_KEY = 'natpac_admin_session_meta'; // Only stores non-sensitive session metadata
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

function parseStoredSession(): AdminSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const meta = JSON.parse(stored) as SessionMeta;
    if (new Date(meta.expiresAt) <= new Date()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return { ...meta, role: normalizeRole(meta.role), govMasterKey: '' };
  } catch {
    return null;
  }
}

function persistSessionMeta(meta: SessionMeta) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(meta));
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load non-sensitive session metadata from sessionStorage
  useEffect(() => {
    const nextSession = parseStoredSession();
    if (nextSession) {
      setSession(nextSession);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (
    username: string,
    password: string,
    govKey: string
  ): Promise<boolean> => {
    setError(null);
    try {
      const result = await loginAdmin(username, password, govKey);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

      const newSession: AdminSession = {
        adminId: username,
        role: normalizeRole(result.role),
        govMasterKey: govKey,
        loginTime: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      const meta = {
        adminId: username,
        role: normalizeRole(result.role),
        loginTime: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
      persistSessionMeta(meta);
      setSession(newSession);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid credentials.');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (session) {
      const hashedUser = await sha256Hex(session.adminId);
      try {
        await appendAdminAudit({
          adminId: hashedUser,
          role: session.role,
          action: 'ADMIN_LOGOUT',
        });
      } catch {
        // Non-blocking on logout
      }
    }
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, [session]);

  const isExpired = session ? new Date(session.expiresAt) <= new Date() : false;

  const value: AdminAuthContextValue = {
    session,
    isAuthenticated: !!session && !isExpired && !!session.govMasterKey,
    isLoading,
    error,
    login,
    logout,
    clearError: () => setError(null),
  };

  return createElement(AdminAuthContext.Provider, { value }, children);
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  };

  return context;
}
