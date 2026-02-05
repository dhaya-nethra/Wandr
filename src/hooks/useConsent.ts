import { useState, useEffect } from 'react';

const CONSENT_KEY = 'natpac_consent';

export function useConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    setHasConsent(stored === 'true');
    setIsLoading(false);
  }, []);

  const grantConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setHasConsent(true);
  };

  const revokeConsent = () => {
    localStorage.removeItem(CONSENT_KEY);
    setHasConsent(false);
  };

  return {
    hasConsent,
    isLoading,
    grantConsent,
    revokeConsent,
  };
}