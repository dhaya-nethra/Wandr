/**
 * Detects the secret admin keyword typed anywhere on the page (not inside inputs).
 *
 * Secret keyword: "natpac"  (case-insensitive, letters must be typed within 3 s of each other)
 *
 * When the full sequence is detected, returns `triggered = true` for 8 seconds,
 * giving the user time to click the floating admin portal button that appears.
 */

import { useEffect, useState } from 'react';

const SECRET_KEYWORD = 'natpac';
const TIMEOUT_MS = 3000; // reset buffer after 3 s of inactivity

export function useAdminKeyword(): boolean {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    let buffer = '';
    let timer: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form fields
      const tag = (document.activeElement as HTMLElement)?.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      buffer += e.key.toLowerCase();

      // Keep only the last N characters (length of keyword)
      if (buffer.length > SECRET_KEYWORD.length) {
        buffer = buffer.slice(-SECRET_KEYWORD.length);
      }

      // Reset inactivity timer
      clearTimeout(timer);
      timer = setTimeout(() => { buffer = ''; }, TIMEOUT_MS);

      // Check for match
      if (buffer === SECRET_KEYWORD) {
        setTriggered(true);
        buffer = '';
        // Auto-hide after 8 seconds
        setTimeout(() => setTriggered(false), 8000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, []);

  return triggered;
}
