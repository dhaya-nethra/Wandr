import { useState, useEffect, useCallback } from 'react';
import { Trip } from '@/types/trip';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { fetchTrips, syncTrips, deleteTrip as deleteTripOnServer } from '@/lib/backendApi';

const AUTH_KEY = 'natpac_participant_id';

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
    await syncTrips(participantStorageKey(participantId), updatedTrips);
    return newTrip;
  }, [trips, participantId]);

  const updateTrip = useCallback(async (id: string, changes: Partial<Omit<Trip, 'id' | 'tripNumber' | 'createdAt'>>) => {
    if (!participantId) return;
    const updatedTrips = trips.map((t) =>
      t.id === id ? { ...t, ...changes, synced: false } : t
    );
    setTrips(updatedTrips);
    await syncTrips(participantStorageKey(participantId), updatedTrips);
  }, [trips, participantId]);

  const deleteTrip = useCallback(async (id: string) => {
    if (!participantId) return;
    const updatedTrips = trips.filter((t) => t.id !== id);
    setTrips(updatedTrips);
    await deleteTripOnServer(participantStorageKey(participantId), id);
    await syncTrips(participantStorageKey(participantId), updatedTrips);
  }, [trips, participantId]);

  const clearAllTrips = useCallback(async () => {
    if (!participantId) return;
    setTrips([]);
    await syncTrips(participantStorageKey(participantId), []);
  }, [participantId]);

  return {
    trips,
    isLoading,
    saveTrip,
    updateTrip,
    deleteTrip,
    clearAllTrips,
  };
}