import { useState, useEffect, useCallback } from 'react';
import { Trip } from '@/types/trip';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { fetchTrips, syncTrips, deleteTrip as deleteTripOnServer, clearParticipantData } from '@/lib/backendApi';

const AUTH_KEY = 'natpac_participant_id';
const TRIPS_CACHE_PREFIX = 'natpac_trips_cache_';

async function resolveParticipantId(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: AUTH_KEY });
    return value;
  }
  return localStorage.getItem(AUTH_KEY);
}

function participantStorageKey(participantId: string): string {
  return participantId;
}

function tripsCacheKey(participantId: string): string {
  return `${TRIPS_CACHE_PREFIX}${participantId}`;
}

async function loadCachedTrips(participantId: string): Promise<Trip[]> {
  try {
    const key = tripsCacheKey(participantId);
    let raw: string | null = null;

    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      raw = value;
    } else {
      raw = localStorage.getItem(key);
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveCachedTrips(participantId: string, trips: Trip[]): Promise<void> {
  const payload = JSON.stringify(trips);
  const key = tripsCacheKey(participantId);

  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value: payload });
  } else {
    localStorage.setItem(key, payload);
  }
}

function markTripsSynced(trips: Trip[], synced: boolean): Trip[] {
  return trips.map((trip) => ({ ...trip, synced }));
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
        const loaded = await fetchTrips(participantStorageKey(pid));
        const syncedTrips = markTripsSynced(loaded, true);
        setTrips(syncedTrips);
        await saveCachedTrips(pid, syncedTrips);
      } catch (e) {
        console.error('Failed to load trips:', e);
        const cached = await loadCachedTrips(pid);
        setTrips(cached);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const resolveActiveParticipantId = useCallback(async (): Promise<string | null> => {
    if (participantId) return participantId;
    const pid = await resolveParticipantId();
    if (pid) {
      setParticipantId(pid);
    }
    return pid;
  }, [participantId]);

  const persistAndSyncTrips = useCallback(async (
    pid: string,
    nextTrips: Trip[],
    options?: { skipDeleteEndpoint?: boolean; deletedTripId?: string }
  ): Promise<Trip[]> => {
    await saveCachedTrips(pid, nextTrips);

    try {
      if (!options?.skipDeleteEndpoint && options?.deletedTripId) {
        await deleteTripOnServer(participantStorageKey(pid), options.deletedTripId);
      }
      await syncTrips(participantStorageKey(pid), nextTrips);
      const syncedTrips = markTripsSynced(nextTrips, true);
      setTrips(syncedTrips);
      await saveCachedTrips(pid, syncedTrips);
      return syncedTrips;
    } catch (error) {
      console.error('Trip sync failed, keeping local data:', error);
      const unsyncedTrips = markTripsSynced(nextTrips, false);
      setTrips(unsyncedTrips);
      await saveCachedTrips(pid, unsyncedTrips);
      return unsyncedTrips;
    }
  }, []);

  const saveTrip = useCallback(async (
    trip: Omit<Trip, 'id' | 'tripNumber' | 'createdAt'>
  ) => {
    const pid = await resolveActiveParticipantId();
    if (!pid) throw new Error('Not authenticated');

    const newTrip: Trip = {
      ...trip,
      id: crypto.randomUUID(),
      tripNumber: trips.length + 1,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    const updatedTrips = [...trips, newTrip];
    setTrips(updatedTrips);

    await persistAndSyncTrips(pid, updatedTrips);
    return newTrip;
  }, [trips, resolveActiveParticipantId, persistAndSyncTrips]);

  const updateTrip = useCallback(async (id: string, changes: Partial<Omit<Trip, 'id' | 'tripNumber' | 'createdAt'>>) => {
    const pid = await resolveActiveParticipantId();
    if (!pid) return;

    const updatedTrips = trips.map((t) =>
      t.id === id ? { ...t, ...changes, synced: false } : t
    );
    setTrips(updatedTrips);
    await persistAndSyncTrips(pid, updatedTrips);
  }, [trips, resolveActiveParticipantId, persistAndSyncTrips]);

  const deleteTrip = useCallback(async (id: string) => {
    const pid = await resolveActiveParticipantId();
    if (!pid) return;

    const updatedTrips = trips.filter((t) => t.id !== id);
    setTrips(updatedTrips);
    await persistAndSyncTrips(pid, updatedTrips, { deletedTripId: id });
  }, [trips, resolveActiveParticipantId, persistAndSyncTrips]);

  const clearAllTrips = useCallback(async () => {
    const pid = await resolveActiveParticipantId();
    if (!pid) return;

    setTrips([]);
    await saveCachedTrips(pid, []);
    try {
      await clearParticipantData(pid);
    } catch (e) {
      console.error('Failed to clear server data:', e);
    }
  }, [resolveActiveParticipantId]);

  return {
    trips,
    isLoading,
    saveTrip,
    updateTrip,
    deleteTrip,
    clearAllTrips,
  };
}