import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const AUTH_KEY = 'natpac_participant_id';

export function useAuth() {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: AUTH_KEY });
        setParticipantId(value || null);
      } else {
        const stored = localStorage.getItem(AUTH_KEY);
        setParticipantId(stored || null);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const login = async (name: string) => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: AUTH_KEY, value: name });
    } else {
      localStorage.setItem(AUTH_KEY, name);
    }

    setParticipantId(name);
  };

  const logout = async () => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: AUTH_KEY });
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
    setParticipantId(null);
  };

  return {
    participantId,
    isLoggedIn: !!participantId,
    isLoading,
    login,
    logout,
  };
}
