import { useState, useEffect, useCallback } from 'react';
import { Trip } from '@/types/trip';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { encryptData, decryptData } from '@/lib/crypto';
import {
  syncParticipantData,
  registerParticipantMapping,
  DEMO_MASTER_KEY,
} from '@/lib/adminStorage';

const BASE_KEY = 'natpac_trips';
const AUTH_KEY = 'natpac_participant_id';
const LEGACY_KEY = 'natpac_trips'; // pre-encryption storage key

async function resolveParticipantId(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: AUTH_KEY });
    return value;
  }
  return localStorage.getItem(AUTH_KEY);
}

function participantStorageKey(participantId: string): string {
  const safe = participantId.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32);
  return `${BASE_KEY}_enc_${safe}`;
}

async function getStoredTrips(participantId: string): Promise<Trip[]> {
  const key = participantStorageKey(participantId);

  let raw: string | null = null;
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    raw = value;
  } else {
    raw = localStorage.getItem(key);
  }

  if (raw) {
    try {
      // Attempt AES-GCM decryption
      const decrypted = await decryptData(raw, participantId, DEMO_MASTER_KEY);
      return decrypted as Trip[];
    } catch {
      // Fallback: maybe it's plain JSON from a previous version
      try { return JSON.parse(raw); } catch { return []; }
    }
  }

  // Migrate legacy unencrypted data if present
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const parsed: Trip[] = JSON.parse(legacy);
      // Re-save as encrypted
      await setStoredTrips(parsed, participantId);
      localStorage.removeItem(LEGACY_KEY);
      return parsed;
    } catch {
      return [];
    }
  }

  return [];
}

async function setStoredTrips(trips: Trip[], participantId: string): Promise<void> {
  const key = participantStorageKey(participantId);
  const encrypted = await encryptData(trips, participantId, DEMO_MASTER_KEY);

  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value: encrypted });
  } else {
    localStorage.setItem(key, encrypted);
  }

  // Keep central admin store in sync (encrypted under admin master key)
  try {
    await registerParticipantMapping(participantId, DEMO_MASTER_KEY);
    await syncParticipantData(participantId, trips, DEMO_MASTER_KEY);
  } catch (e) {
    console.warn('Central sync failed (non-critical):', e);
  }
}

async function removeStoredTrips(participantId: string): Promise<void> {
  const key = participantStorageKey(participantId);
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
  try {
    await syncParticipantData(participantId, [], DEMO_MASTER_KEY);
  } catch (e) {
    console.warn('Central sync failed (non-critical):', e);
  }
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    resolveParticipantId().then(async (pid) => {
      setParticipantId(pid);
      if (!pid) {
        setIsLoading(false);
        return;
      }
      try {
        const loaded = await getStoredTrips(pid);
        setTrips(loaded);
      } catch (e) {
        console.error('Failed to load trips:', e);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const saveTrip = useCallback(async (
    trip: Omit<Trip, 'id' | 'tripNumber' | 'createdAt'>
  ) => {
    if (!participantId) throw new Error('Not authenticated');
    const newTrip: Trip = {
      ...trip,
      id: crypto.randomUUID(),
      tripNumber: trips.length + 1,
      createdAt: new Date().toISOString(),
    };
    const updatedTrips = [...trips, newTrip];
    setTrips(updatedTrips);
    await setStoredTrips(updatedTrips, participantId);
    return newTrip;
  }, [trips, participantId]);

  const deleteTrip = useCallback(async (id: string) => {
    if (!participantId) return;
    const updatedTrips = trips.filter((t) => t.id !== id);
    setTrips(updatedTrips);
    await setStoredTrips(updatedTrips, participantId);
  }, [trips, participantId]);

  const clearAllTrips = useCallback(async () => {
    if (!participantId) return;
    setTrips([]);
    await removeStoredTrips(participantId);
  }, [participantId]);

  return {
    trips,
    isLoading,
    saveTrip,
    deleteTrip,
    clearAllTrips,
  };
}