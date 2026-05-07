import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { reverseGeocodeCoordinates } from '@/lib/geocoding';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface GeolocationState {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    isLoading: false,
    error: null,
  });

  const getCurrentLocation = useCallback((): Promise<Location> => {
    return new Promise(async (resolve, reject) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        let lat: number;
        let lng: number;

        if (Capacitor.isNativePlatform()) {
          // Native Android / iOS — use Capacitor Geolocation plugin
          const permission = await Geolocation.requestPermissions();
          if (permission.location !== 'granted') {
            const msg = 'Location permission denied';
            setState(prev => ({ ...prev, isLoading: false, error: msg }));
            reject(new Error(msg));
            return;
          }
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } else {
          // Web browser fallback
          if (!navigator.geolocation) {
            const msg = 'Geolocation is not supported by your browser';
            setState(prev => ({ ...prev, isLoading: false, error: msg }));
            reject(new Error(msg));
            return;
          }
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }

        const address = await reverseGeocodeCoordinates(lat, lng);
        const location: Location = { lat, lng, address };
        setState({ location, isLoading: false, error: null });
        resolve(location);
      } catch (error: any) {
        let errorMessage = 'Failed to get location';
        // GeolocationPositionError has a numeric .code (1=denied, 2=unavailable, 3=timeout)
        const code = error?.code ?? error?.PERMISSION_DENIED;
        if (code === 1) errorMessage = 'Location permission denied';
        else if (code === 2) errorMessage = 'Location unavailable';
        else if (code === 3) errorMessage = 'Location request timed out';
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        // Re-throw the original error so callers can inspect .code directly
        reject(error instanceof Error ? error : new Error(errorMessage));
      }
    });
  }, []);

  return {
    ...state,
    getCurrentLocation,
  };
}