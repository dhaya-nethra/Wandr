import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TripForm } from '@/components/trips/TripForm';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useTrips } from '@/hooks/useTrips';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';
import {
  MapPin, Navigation, Square, Play, Loader2, AlertTriangle,
} from 'lucide-react';

interface Location { lat: number; lng: number; address?: string }

/** Calculates distance between two GPS coordinates using the Haversine formula */
function haversineKm(a: Location, b: Location): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data.display_name ?? undefined;
  } catch { return undefined; }
}

type TripStatus = 'idle' | 'tracking' | 'completed';

export default function ActiveTrip() {
  const navigate = useNavigate();
  const { saveTrip } = useTrips();
  const { trackingEnabled } = useLocationTracking();
  const { getCurrentLocation } = useGeolocation();

  const [status, setStatus] = useState<TripStatus>('idle');
  const [origin, setOrigin] = useState<Location | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [pendingTrip, setPendingTrip] = useState<any | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const watchIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const originRef = useRef<Location | null>(null);

  // Elapsed timer
  useEffect(() => {
    if (status === 'tracking') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const startTracking = async () => {
    if (!trackingEnabled) {
      toast.error('Location tracking is disabled. Enable it in Profile > Location Tracking.');
      return;
    }
    setIsStarting(true);
    try {
      const loc = await getCurrentLocation();
      setOrigin(loc);
      originRef.current = loc;
      setCurrentLocation(loc);
      setStartTime(new Date().toISOString());
      setDistance(0);
      setElapsed(0);
      setStatus('tracking');
      toast.success('Trip started! GPS tracking active.');

      // Start watching position
      if (Capacitor.isNativePlatform()) {
        watchIdRef.current = await Geolocation.watchPosition(
          { enableHighAccuracy: true },
          (pos) => {
            if (!pos) return;
            const newLoc: Location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCurrentLocation(newLoc);
            if (originRef.current) {
              setDistance(haversineKm(originRef.current, newLoc));
            }
          }
        );
      } else {
        // Web fallback — poll every 5s
        const poll = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (p) => {
              const newLoc: Location = { lat: p.coords.latitude, lng: p.coords.longitude };
              setCurrentLocation(newLoc);
              if (originRef.current) setDistance(haversineKm(originRef.current, newLoc));
            },
            undefined,
            { enableHighAccuracy: true }
          );
        }, 5000);
        watchIdRef.current = String(poll as unknown as number);
      }
    } catch (err) {
      toast.error('Could not get location. Please enable GPS and try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const stopTracking = async () => {
    if (watchIdRef.current) {
      if (Capacitor.isNativePlatform()) {
        await Geolocation.clearWatch({ id: watchIdRef.current });
      } else {
        clearInterval(Number(watchIdRef.current));
      }
      watchIdRef.current = null;
    }

    const endTime = new Date().toISOString();
    const destLoc = currentLocation || origin;

    if (destLoc) {
      const addr = await reverseGeocode(destLoc.lat, destLoc.lng);
      const finalDest: Location = { ...destLoc, address: addr };
      setDestination(finalDest);

      // Pre-build a draft trip to hand off to TripForm for details
      const draft = {
        origin: origin!,
        destination: finalDest,
        startTime: startTime,
        endTime,
        distance: parseFloat(distance.toFixed(2)),
      };
      setPendingTrip(draft);
    }

    setStatus('completed');
    toast.info('Trip ended. Please complete the trip details below.', { duration: 5000 });
  };

  return (
    <AppLayout>
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <h1 className="text-lg font-semibold text-foreground">Auto Trip Tracking</h1>
        <p className="text-sm text-muted-foreground">GPS-based trip detection</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {!trackingEnabled && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Location tracking is disabled. Go to <strong>Profile</strong> to enable it.
            </p>
          </div>
        )}

        {/* Status Card */}
        {status !== 'completed' && (
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Trip Status</CardTitle>
                <Badge variant={status === 'tracking' ? 'default' : 'secondary'}>
                  {status === 'tracking' ? (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      Tracking
                    </span>
                  ) : 'Idle'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {status === 'tracking' && (
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-2xl font-bold text-foreground">{formatElapsed(elapsed)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Duration</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-2xl font-bold text-foreground">{distance.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">km travelled</p>
                  </div>
                </div>
              )}

              {origin && status === 'tracking' && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Origin</p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{origin.address?.split(',')[0] || `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`}</span>
                  </div>
                </div>
              )}

              {currentLocation && status === 'tracking' && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Current Position</p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Navigation className="h-3.5 w-3.5 text-secondary shrink-0" />
                    <span>{currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {status === 'idle' && (
                  <Button
                    className="flex-1 h-12 gradient-primary gap-2"
                    onClick={startTracking}
                    disabled={isStarting || !trackingEnabled}
                  >
                    {isStarting ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Getting GPS…</>
                    ) : (
                      <><Play className="h-5 w-5" /> Start Trip</>
                    )}
                  </Button>
                )}
                {status === 'tracking' && (
                  <Button
                    variant="destructive"
                    className="flex-1 h-12 gap-2"
                    onClick={stopTracking}
                  >
                    <Square className="h-5 w-5" /> End Trip
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Trip Details after auto-detection */}
        {status === 'completed' && pendingTrip && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/20 p-3">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Trip auto-detected! Please complete the details below so your data helps Kerala's transport research.
              </p>
            </div>

            {/* Pass the draft trip values pre-filled into TripForm */}
            <TripForm
              trip={{
                id: '',
                tripNumber: 0,
                ...pendingTrip,
                mode: 'other' as const,
                purpose: 'other' as const,
                companions: 0,
                frequency: 'occasional' as const,
                cost: 0,
                createdAt: new Date().toISOString(),
                needsDetails: false,
              }}
              onSuccess={() => {
                setPendingTrip(null);
                navigate('/trips');
              }}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
