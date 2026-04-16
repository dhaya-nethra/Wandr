/**
 * Manages the user's location tracking preference (Enable/Disable).
 * Stored in localStorage / Capacitor Preferences so it persists across sessions.
 */
import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const TRACKING_KEY = 'natpac_location_tracking_enabled';

export function useLocationTracking() {
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let value: string | null = null;
      if (Capacitor.isNativePlatform()) {
        const { value: v } = await Preferences.get({ key: TRACKING_KEY });
        value = v;
      } else {
        value = localStorage.getItem(TRACKING_KEY);
      }
      // Default to enabled if not set
      setTrackingEnabled(value === null ? true : value === 'true');
      setIsLoading(false);
    };
    load();
  }, []);

  const setTracking = useCallback(async (enabled: boolean) => {
    setTrackingEnabled(enabled);
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: TRACKING_KEY, value: String(enabled) });
    } else {
      localStorage.setItem(TRACKING_KEY, String(enabled));
    }
  }, []);

  return { trackingEnabled, isLoading, setTracking };
}
