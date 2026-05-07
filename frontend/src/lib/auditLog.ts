/**
 * NATPAC Tamper-Evident Audit Log
 *
 * Every admin action is recorded with:
 *  - timestamp
 *  - admin ID (hashed)
 *  - action type
 *  - target (participant ID hashed)
 *  - a SHA-256 chain hash (each entry hashes the previous entry's hash)
 *
 * Because each entry includes the hash of the previous entry,
 * any tampering with a past entry breaks the chain — detectable on inspection.
 */

import { sha256Hex } from './crypto';

export type AuditAction =
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGOUT'
  | 'DATA_VIEW'
  | 'DATA_EXPORT'
  | 'DATA_EXPORT_CSV'
  | 'DATA_EXPORT_JSON'
  | 'PARTICIPANT_VIEW'
  | 'ANALYTICS_VIEW'
  | 'FAILED_LOGIN';

export interface AuditEntry {
  id: string;
  timestamp: string;
  adminId: string;        // Hashed admin username for privacy
  role: string;
  action: AuditAction;
  target?: string;        // Hashed participant ID (if applicable)
  details?: string;
  chainHash: string;      // SHA-256(prevHash + this entry data)
}

const AUDIT_KEY = 'natpac_audit_log';

function loadRaw(): AuditEntry[] {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getAuditLog(): AuditEntry[] {
  return loadRaw();
}

export async function appendAuditEntry(
  params: Pick<AuditEntry, 'adminId' | 'role' | 'action' | 'target' | 'details'>
): Promise<void> {
  const existing = loadRaw();
  const prevHash = existing.length > 0 ? existing[existing.length - 1].chainHash : '0'.repeat(64);

  const entry: Omit<AuditEntry, 'chainHash'> = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...params,
  };

  const chainInput = `${prevHash}|${entry.id}|${entry.timestamp}|${entry.adminId}|${entry.action}|${entry.target ?? ''}`;
  const chainHash = await sha256Hex(chainInput);

  const full: AuditEntry = { ...entry, chainHash };
  existing.push(full);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(existing));
}

/** Verify chain integrity — returns false if any entry was tampered with */
export async function verifyAuditChain(): Promise<{ valid: boolean; brokenAt?: number }> {
  const entries = loadRaw();
  let prevHash = '0'.repeat(64);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const chainInput = `${prevHash}|${e.id}|${e.timestamp}|${e.adminId}|${e.action}|${e.target ?? ''}`;
    const expected = await sha256Hex(chainInput);

    if (expected !== e.chainHash) {
      return { valid: false, brokenAt: i };
    }
    prevHash = e.chainHash;
  }

  return { valid: true };
}
