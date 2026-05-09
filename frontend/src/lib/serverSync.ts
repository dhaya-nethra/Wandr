/**
 * Client-side helper to sync trip data to the NATPAC backend server.
 * Falls back silently if the server is unreachable (offline-first design).
 */
import { Trip } from '@/types/trip';

const useProxy = typeof window !== 'undefined' && window.location.protocol.startsWith('http') && import.meta.env.DEV;
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (useProxy ? '' : 'https://wandr-backend-9ltd.onrender.com');

export async function syncTripsToServer(
  participantId: string,
  trips: Trip[]
): Promise<boolean> {
  try {
    const res = await fetch(`${SERVER_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, trips }),
    });
    return res.ok;
  } catch {
    // Server unreachable — not a blocking error
    return false;
  }
}

export async function deleteServerTrip(
  participantId: string,
  tripId: string
): Promise<void> {
  try {
    await fetch(`${SERVER_URL}/api/trips/${encodeURIComponent(participantId)}/${tripId}`, {
      method: 'DELETE',
    });
  } catch {
    // silent
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
