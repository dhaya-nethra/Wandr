import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const CONSENT_KEY = 'natpac_consent';

export function useConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: CONSENT_KEY });
        setHasConsent(value === 'true');
      } else {
        const stored = localStorage.getItem(CONSENT_KEY);
        setHasConsent(stored === 'true');
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const grantConsent = async () => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: CONSENT_KEY, value: 'true' });
    } else {
      localStorage.setItem(CONSENT_KEY, 'true');
    }
    setHasConsent(true);
  };

  const revokeConsent = async () => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: CONSENT_KEY });
    } else {
      localStorage.removeItem(CONSENT_KEY);
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