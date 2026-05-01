import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from './useAuth';

export async function checkConsentStatus(participantId: string): Promise<boolean> {
  const key = `natpac_consent_${participantId}`;
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value === 'true';
  } else {
    return localStorage.getItem(key) === 'true';
  }
}

export function useConsent() {
  const { participantId } = useAuth();
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!participantId) {
        setHasConsent(false);
        setIsLoading(false);
        return;
      }
      const granted = await checkConsentStatus(participantId);
      setHasConsent(granted);
      setIsLoading(false);
    };
    load();
  }, [participantId]);

  const grantConsent = async () => {
    if (!participantId) return;
    const key = `natpac_consent_${participantId}`;
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value: 'true' });
    } else {
      localStorage.setItem(key, 'true');
    }
    setHasConsent(true);
  };

  const revokeConsent = async () => {
    if (!participantId) return;
    const key = `natpac_consent_${participantId}`;
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
    setHasConsent(false);
  };

  return {
    hasConsent,
    isLoading,
    grantConsent,
    revokeConsent,
  };
}