import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LocationPermissionDialog } from './LocationPermissionDialog';

// App-level location preference stored in localStorage
const PERM_KEY = 'natpac_location_perm';

function readStoredPerm(): 'allow' | 'deny' | null {
  try {
    const v = localStorage.getItem(PERM_KEY);
    return v === 'allow' || v === 'deny' ? v : null;
  } catch {
    return null;
  }
}

// Returns browser-specific instructions for enabling location access
function getBrowserInstructions(): string {
  const ua = navigator.userAgent;
  if (/firefox/i.test(ua)) {
    return (
      'In Firefox: click the ℹ️ icon beside the address bar → ' +
      '"More Information" → "Permissions" tab → ' +
      'find "Access your location" → uncheck "Use Default" → select "Allow" → close the dialog, then try again.'
    );
  }
  if (/edg\//i.test(ua)) {
    return (
      'In Edge: click the 🔒 icon in the address bar → ' +
      '"Permissions for this site" → set Location to "Allow", then try again.'
    );
  }
  // Chrome / Chromium / others
  return (
    'Click the 🔒 icon in the address bar → "Site settings" → ' +
    'set Location to "Allow", then try again.'
  );
}

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationPickerProps {
  label: string;
  value: Location | null;
  onChange: (location: Location | null) => void;
  error?: string;
}

export function LocationPicker({ label, value, onChange, error }: LocationPickerProps) {
  const { getCurrentLocation, isLoading, error: geoError } = useGeolocation();
  const [manualEntry, setManualEntry] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showPermDialog, setShowPermDialog] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  // Used only to trigger a re-render after perm preference changes
  const [, setPermVersion] = useState(0);

  const savePermChoice = (choice: 'allow' | 'deny') => {
    try { localStorage.setItem(PERM_KEY, choice); } catch { /* ignore */ }
    setPermVersion(v => v + 1);
  };

  const clearPermChoice = () => {
    try { localStorage.removeItem(PERM_KEY); } catch { /* ignore */ }
    setPermVersion(v => v + 1);
  };

  // Actually calls the browser geolocation API
  const doGetLocation = async () => {
    setLocalError(null);
    try {
      const location = await getCurrentLocation();
      onChange(location);
    } catch (err: any) {
      // GeolocationPositionError code 1 = PERMISSION_DENIED
      const isPermDenied = err?.code === 1 || /permission|denied/i.test(err?.message ?? '');
      if (isPermDenied) {
        // Clear any saved "allow" preference — browser is blocking regardless
        clearPermChoice();
        setLocalError('Location was blocked. ' + getBrowserInstructions());
      } else if (err?.message) {
        setLocalError(err.message);
      }
    }
  };

  const handleGetLocation = async () => {
    setLocalError(null);

    // ── 0. HTTP / non-secure context ──────────────────────────────────────
    // Geolocation is blocked by browsers on plain HTTP (non-localhost).
    // We still attempt the call so the browser can show its own prompt if it
    // allows it (Firefox lets users override this via Page Info → Permissions).
    // If it fails we show the right instructions below.

    // ── 1. Check browser-level geolocation permission ─────────────────────
    let browserState: PermissionState | null = null;
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        });
        browserState = result.state;
      } catch {
        // permissions API unavailable — may happen on HTTP in some browsers
      }
    }

    if (browserState === 'denied') {
      const isHttp = !window.isSecureContext;
      const httpNote = isHttp
        ? 'You are on HTTP (not HTTPS), so location is blocked by default. '
        : 'Location is blocked in your browser settings. ';
      setLocalError(httpNote + getBrowserInstructions());
      return;
    }

    if (browserState === 'granted') {
      // Browser has already granted — respect app-level deny if set,
      // otherwise go straight to getting location.
      if (readStoredPerm() === 'deny') {
        setLocalError('You previously denied location access.');
        return;
      }
      await doGetLocation();
      return;
    }

    // browserState === 'prompt' or permissions API unavailable
    // ── 2. Check in-app stored preference ─────────────────────────────────
    const stored = readStoredPerm();

    if (stored === 'allow') {
      await doGetLocation();
    } else if (stored === 'deny') {
      setLocalError('You previously denied location access.');
    } else {
      // Show our custom permission dialog before calling the browser API
      setDialogKey(k => k + 1);
      setShowPermDialog(true);
    }
  };

  const handlePermAllow = async (remember: boolean) => {
    setShowPermDialog(false);
    if (remember) savePermChoice('allow');
    await doGetLocation();
  };

  const handlePermDeny = (remember: boolean) => {
    setShowPermDialog(false);
    if (remember) savePermChoice('deny');
    setLocalError('Location access denied.');
  };

  const handlePermDismiss = () => {
    setShowPermDialog(false);
    // No error, no preference saved — user can try again
  };

  const handleResetPref = () => {
    clearPermChoice();
    setLocalError(null);
    setDialogKey(k => k + 1);
    setShowPermDialog(true);
  };

  const handleManualSearch = async () => {
    const q = manualQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { Accept: 'application/json' } },
      );
      const data = await res.json();
      if (data.length === 0) {
        setSearchError('No location found. Try a more specific name.');
        return;
      }
      onChange({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name,
      });
      setManualEntry(false);
      setManualQuery('');
    } catch {
      setSearchError('Search failed. Check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const storedPerm = readStoredPerm();
  const displayError = localError || geoError;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      <LocationPermissionDialog
        key={dialogKey}
        open={showPermDialog}
        onAllow={handlePermAllow}
        onDeny={handlePermDeny}
        onDismiss={handlePermDismiss}
      />

      {value ? (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              {value.address ? (
                <p className="text-sm text-foreground line-clamp-2">{value.address}</p>
              ) : (
                <p className="text-sm text-foreground">
                  {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setManualEntry(false);
                  setLocalError(null);
                }}
                className="text-xs text-primary hover:underline mt-1"
              >
                Change location
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleGetLocation}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {isLoading ? 'Fetching location…' : 'Use current location'}
          </Button>

          {displayError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 space-y-1">
              <p className="text-xs text-destructive">{displayError}</p>
              {storedPerm === 'deny' && (
                <button
                  type="button"
                  onClick={handleResetPref}
                  className="text-xs text-primary hover:underline"
                >
                  Change preference
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => { setManualEntry(!manualEntry); setSearchError(null); setManualQuery(''); }}
            className="text-xs text-primary hover:underline"
          >
            {manualEntry ? 'Hide manual entry' : 'Enter location name manually'}
          </button>

          {manualEntry && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. Kochi, Kerala"
                  value={manualQuery}
                  onChange={(e) => { setManualQuery(e.target.value); setSearchError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleManualSearch}
                  disabled={isSearching || !manualQuery.trim()}
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>
              {searchError && (
                <p className="text-xs text-destructive">{searchError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}