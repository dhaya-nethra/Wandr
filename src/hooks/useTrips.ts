import { useState, useEffect } from 'react';
import { Trip } from '@/types/trip';

const STORAGE_KEY = 'natpac_trips';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTrips(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored trips:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveTrip = (trip: Omit<Trip, 'id' | 'tripNumber' | 'createdAt'>) => {
    const newTrip: Trip = {
      ...trip,
      id: crypto.randomUUID(),
      tripNumber: trips.length + 1,
      createdAt: new Date().toISOString(),
    };
    
    const updatedTrips = [...trips, newTrip];
    setTrips(updatedTrips);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
    return newTrip;
  };

  const deleteTrip = (id: string) => {
    const updatedTrips = trips.filter(t => t.id !== id);
    setTrips(updatedTrips);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
  };

  const clearAllTrips = () => {
    setTrips([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    trips,
    isLoading,
    saveTrip,
    deleteTrip,
    clearAllTrips,
  };
}