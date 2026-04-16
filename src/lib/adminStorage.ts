/**
 * NATPAC Central Encrypted Data Store
 *
 * Maintains a central repository of ALL participants' encrypted trip data.
 * Regular users can ONLY access their own shard.
 * Admins with the government master key can access every shard.
 *
 * Storage layout (localStorage key: 'natpac_central_store'):
 * {
 *   [hashedParticipantId]: {
 *     participantAlias: string,   // display-safe short alias
 *     encryptedTrips: string,     // base64 AES-256-GCM encrypted JSON
 *     lastUpdated: string,        // ISO timestamp (NOT encrypted)
 *     tripCount: number,          // plain count (NOT a privacy risk)
 *   }
 * }
 */

import { encryptData, decryptData, sha256Hex } from './crypto';
import { Trip } from '@/types/trip';

const CENTRAL_KEY = 'natpac_central_store';

// In production this would NEVER be in client code — it would live in an HSM.
// For the demo, we hard-code the key so admins can enter it at login.
export const DEMO_MASTER_KEY = 'NATPAC-KERALA-GOV-2026-';

export interface ParticipantShard {
  participantAlias: string;
  encryptedTrips: string;
  lastUpdated: string;
  tripCount: number;
}

export interface DecryptedShard {
  participantAlias: string;
  participantId: string;
  hashedId: string;
  trips: Trip[];
  lastUpdated: string;
}

function loadStore(): Record<string, ParticipantShard> {
  try {
    return JSON.parse(localStorage.getItem(CENTRAL_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, ParticipantShard>): void {
  localStorage.setItem(CENTRAL_KEY, JSON.stringify(store));
}

/** Called by useTrips every time a trip is saved/deleted. */
export async function syncParticipantData(
  participantId: string,
  trips: Trip[],
  masterKey: string
): Promise<void> {
  const hashedId = await sha256Hex(participantId);
  const encryptedTrips = await encryptData(trips, participantId, masterKey);
  const store = loadStore();

  store[hashedId] = {
    participantAlias: `P-${hashedId.slice(0, 8).toUpperCase()}`,
    encryptedTrips,
    lastUpdated: new Date().toISOString(),
    tripCount: trips.length,
  };

  saveStore(store);
}

/** Return all participant shards (encrypted) — used by admin portal */
export function getAllShards(): Record<string, ParticipantShard> {
  return loadStore();
}

/** Decrypt a single shard — requires government master key */
export async function decryptShard(
  hashedId: string,
  shard: ParticipantShard,
  // The admin must provide the original participantId to derive the key.
  // In real systems, the server would hold a mapping of hashedId → encryptedParticipantId.
  // Here we store a reverse-lookup table inside the shard (encrypted).
  govMasterKey: string,
  participantId: string
): Promise<Trip[]> {
  const trips = (await decryptData(
    shard.encryptedTrips,
    participantId,
    govMasterKey
  )) as Trip[];
  return trips;
}

/** Admin-friendly: decrypt ALL shards at once.
 *  Requires the reverse-lookup table (participantId per hash).
 */
export async function decryptAllShards(
  govMasterKey: string
): Promise<DecryptedShard[]> {
  const store = loadStore();

  // We maintain a separate mapping: hashedId → plain participantId
  // This mapping is ITSELF encrypted with the master key.
  const MAPPING_KEY = 'natpac_id_mapping';
  let mapping: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(MAPPING_KEY);
    if (raw) {
      mapping = (await decryptData(raw, '__id_mapping__', govMasterKey)) as Record<string, string>;
    }
  } catch {
    mapping = {};
  }

  const results: DecryptedShard[] = [];
  for (const [hashedId, shard] of Object.entries(store)) {
    const participantId = mapping[hashedId];
    if (!participantId) continue; // Can't decrypt without original ID

    try {
      const trips = await decryptShard(hashedId, shard, govMasterKey, participantId);
      results.push({
        participantAlias: shard.participantAlias,
        participantId,
        hashedId,
        trips,
        lastUpdated: shard.lastUpdated,
      });
    } catch {
      // Wrong key or corrupted — silently skip
    }
  }

  return results;
}

/** Register a participantId in the encrypted mapping — called on first sync */
export async function registerParticipantMapping(
  participantId: string,
  govMasterKey: string
): Promise<void> {
  const hashedId = await sha256Hex(participantId);
  const MAPPING_KEY = 'natpac_id_mapping';

  let mapping: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(MAPPING_KEY);
    if (raw) {
      mapping = (await decryptData(raw, '__id_mapping__', govMasterKey)) as Record<string, string>;
    }
  } catch {
    mapping = {};
  }

  if (mapping[hashedId]) return; // Already registered

  mapping[hashedId] = participantId;
  const encrypted = await encryptData(mapping, '__id_mapping__', govMasterKey);
  localStorage.setItem(MAPPING_KEY, encrypted);
}

/** Count of registered participants (non-sensitive metadata) */
export function getParticipantCount(): number {
  return Object.keys(loadStore()).length;
}

/** Delete all data for a specific participant (admin action) */
export function deleteParticipantData(hashedId: string): void {
  const store = loadStore();
  delete store[hashedId];
  saveStore(store);
  // Also remove from ID mapping
  const MAPPING_KEY = 'natpac_id_mapping';
  // The mapping is encrypted — we can only remove the store shard,
  // the mapping entry will be skipped on next decryptAllShards
}

// ── Admin User Management ─────────────────────────────────────────────────────
// Additional admin accounts created through the Admin Management panel.
// Built-in demo accounts are validated separately in useAdminAuth.ts.

const ADMIN_USERS_KEY = 'natpac_admin_users';

export interface StoredAdminUser {
  username: string;
  password: string;   // Plain-text for demo; in production would be hashed
  role: 'ADMIN' | 'SCIENTIST';
  addedAt: string;
  addedBy: string;
}

export function getStoredAdminUsers(): StoredAdminUser[] {
  try {
    const users = JSON.parse(localStorage.getItem(ADMIN_USERS_KEY) || '[]') as Array<Omit<StoredAdminUser, 'role'> & { role: string }>;
    return users.map((user) => ({
      ...user,
      role: user.role === 'SCIENTIST' ? 'SCIENTIST' : 'ADMIN',
    }));
  } catch {
    return [];
  }
}

export function addStoredAdminUser(user: StoredAdminUser): void {
  const users = getStoredAdminUsers();
  const idx = users.findIndex((u) => u.username === user.username);
  if (idx !== -1) {
    users[idx] = user; // Update existing
  } else {
    users.push(user);
  }
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
}

export function removeStoredAdminUser(username: string): void {
  const filtered = getStoredAdminUsers().filter((u) => u.username !== username);
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(filtered));
}
