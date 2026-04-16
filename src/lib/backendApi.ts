import { Trip } from '@/types/trip';

export type AdminRole = 'ADMIN' | 'SCIENTIST';

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  adminId: string;
  role: string;
  action: string;
  details?: string;
  chainHash: string;
}

export interface ServerParticipant {
  id: string;
  hashedId: string;
  participantId: string;
  participantAlias: string;
  alias: string;
  createdAt: string;
  lastUpdated: string;
  trips: Trip[];
}

export interface ManagedAdminUser {
  username: string;
  password: string;
  role: AdminRole;
  addedAt: string;
  addedBy: string;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || 'NATPAC-ADMIN-KEY';

function adminHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-admin-key': ADMIN_API_KEY,
  };
}

export async function loginAdmin(username: string, password: string, govKey: string): Promise<{ role: AdminRole }> {
  const res = await fetch(`${SERVER_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, govKey }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Invalid credentials');
  }

  const body = await res.json();
  return { role: body.role === 'SCIENTIST' ? 'SCIENTIST' : 'ADMIN' };
}

export async function fetchTrips(participantId: string): Promise<Trip[]> {
  const res = await fetch(`${SERVER_URL}/api/trips/${encodeURIComponent(participantId)}`);
  if (!res.ok) {
    throw new Error('Failed to fetch trips');
  }
  const body = await res.json();
  return Array.isArray(body.trips) ? body.trips : [];
}

export async function syncTrips(participantId: string, trips: Trip[]): Promise<void> {
  const res = await fetch(`${SERVER_URL}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantId, trips }),
  });
  if (!res.ok) {
    throw new Error('Failed to sync trips');
  }
}

export async function deleteTrip(participantId: string, tripId: string): Promise<void> {
  const res = await fetch(`${SERVER_URL}/api/trips/${encodeURIComponent(participantId)}/${tripId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 404) {
    throw new Error('Failed to delete trip');
  }
}

export async function fetchAdminParticipants(): Promise<ServerParticipant[]> {
  const res = await fetch(`${SERVER_URL}/api/admin/participants`, {
    headers: adminHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to load participants');
  }
  const body = await res.json();
  return Array.isArray(body.participants) ? body.participants : [];
}

export async function fetchAdminAuditLog(): Promise<AdminAuditEntry[]> {
  const res = await fetch(`${SERVER_URL}/api/admin/audit`, {
    headers: adminHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to load audit log');
  }
  const body = await res.json();
  return Array.isArray(body.logs) ? body.logs : [];
}

export async function appendAdminAudit(params: {
  adminId: string;
  role: string;
  action: string;
  details?: string;
}): Promise<void> {
  const res = await fetch(`${SERVER_URL}/api/admin/audit`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error('Failed to write audit log');
  }
}

export async function fetchAdminUsers(): Promise<ManagedAdminUser[]> {
  const res = await fetch(`${SERVER_URL}/api/admin/users`, {
    headers: adminHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to load admin users');
  }
  const body = await res.json();
  return Array.isArray(body.users) ? body.users : [];
}

export async function saveAdminUser(user: ManagedAdminUser): Promise<void> {
  const res = await fetch(`${SERVER_URL}/api/admin/users`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to save admin user');
  }
}

export async function removeAdminUser(username: string): Promise<void> {
  const res = await fetch(`${SERVER_URL}/api/admin/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to remove admin user');
  }
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${SERVER_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
