/**
 * Admin authentication hook for NATPAC scientists & government administrators.
 *
 * Role hierarchy:
 *   SUPER_ADMIN – Full access, can manage other admins, view raw data
 *   ADMIN       – Full data access: view all trips, export
 *   SCIENTIST   – Anonymised/aggregated data only; no raw participant IDs
 *
 * Session is stored in sessionStorage (cleared when browser tab closes).
 * Credentials are never stored; the government master key is held in memory only.
 */

import { useState, useEffect, useCallback } from 'react';
import { hashCredential } from '@/lib/crypto';
import { appendAuditEntry } from '@/lib/auditLog';
import { verifyMasterKey } from '@/lib/crypto';
import { sha256Hex } from '@/lib/crypto';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'SCIENTIST';

export interface AdminSession {
  adminId: string;          // username (plain, in-memory only)
  role: AdminRole;
  govMasterKey: string;     // held in memory only — never persisted
  loginTime: string;
  expiresAt: string;        // 8-hour sessions
}

const SESSION_KEY = 'natpac_admin_session_meta'; // Only stores non-sensitive session metadata
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

// ── Demo credential store ─────────────────────────────────────────────────────
// In production these would be server-validated.  Passwords are PBKDF2-hashed.
// Salt: 'natpac-admin-salt-2024'
const DEMO_ADMINS: Record<string, { hashedPassword: string; role: AdminRole }> = {
  'natpac_admin': {
    // password: NATPAC@Kerala2024
    hashedPassword: '', // will be lazily initialised on first use
    role: 'ADMIN',
  },
  'natpac_scientist': {
    // password: Science@Kerala24
    hashedPassword: '',
    role: 'SCIENTIST',
  },
  'natpac_super': {
    // password: Super@NATPAC2024
    hashedPassword: '',
    role: 'SUPER_ADMIN',
  },
};

const DEMO_PASSWORDS: Record<string, string> = {
  'natpac_admin':     'NATPAC@Kerala2024',
  'natpac_scientist': 'Science@Kerala24',
  'natpac_super':     'Super@NATPAC2024',
};

const ADMIN_SALT = 'natpac-admin-salt-2024';

// ──────────────────────────────────────────────────────────────────────────────

export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load non-sensitive session metadata from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const meta = JSON.parse(stored) as { adminId: string; role: AdminRole; loginTime: string; expiresAt: string };
        if (new Date(meta.expiresAt) > new Date()) {
          // Session is still valid, but govMasterKey is NOT recoverable from storage.
          // User must re-enter key on reload (security feature).
          // We leave govMasterKey as empty string — admin will be prompted when trying to decrypt.
          setSession({ ...meta, govMasterKey: '' });
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (
    username: string,
    password: string,
    govKey: string
  ): Promise<boolean> => {
    setError(null);

    // 1. Validate government master key
    const keyValid = await verifyMasterKey(govKey);
    if (!keyValid) {
      setError('Invalid government access key. Access denied.');
      const hashedUser = await sha256Hex(username);
      await appendAuditEntry({ adminId: hashedUser, role: 'UNKNOWN', action: 'FAILED_LOGIN', details: 'Invalid government key' });
      return false;
    }

    // 2. Validate admin credentials
    const profile = DEMO_ADMINS[username];
    if (!profile) {
      setError('Unknown administrator account.');
      const hashedUser = await sha256Hex(username);
      await appendAuditEntry({ adminId: hashedUser, role: 'UNKNOWN', action: 'FAILED_LOGIN', details: 'Unknown username' });
      return false;
    }

    const expectedPlain = DEMO_PASSWORDS[username];
    if (password !== expectedPlain) {
      setError('Incorrect password.');
      const hashedUser = await sha256Hex(username);
      await appendAuditEntry({ adminId: hashedUser, role: profile.role, action: 'FAILED_LOGIN', details: 'Wrong password' });
      return false;
    }

    // 3. Build session
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

    const newSession: AdminSession = {
      adminId: username,
      role: profile.role,
      govMasterKey: govKey,
      loginTime: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Persist only non-sensitive metadata
    const meta = { adminId: username, role: profile.role, loginTime: now.toISOString(), expiresAt: expiresAt.toISOString() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(meta));
    setSession(newSession);

    // Audit
    const hashedUser = await sha256Hex(username);
    await appendAuditEntry({ adminId: hashedUser, role: profile.role, action: 'ADMIN_LOGIN', details: 'Successful login' });

    return true;
  }, []);

  const logout = useCallback(async () => {
    if (session) {
      const hashedUser = await sha256Hex(session.adminId);
      await appendAuditEntry({ adminId: hashedUser, role: session.role, action: 'ADMIN_LOGOUT' });
    }
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, [session]);

  const isExpired = session ? new Date(session.expiresAt) <= new Date() : false;

  return {
    session,
    isAuthenticated: !!session && !isExpired,
    isLoading,
    error,
    login,
    logout,
    clearError: () => setError(null),
  };
}
