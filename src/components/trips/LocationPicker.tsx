import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationPickerProps {
  label: string;
  value: Location | null;
  onChange: (location: Location) => void;
  error?: string;
}

export function LocationPicker({ label, value, onChange, error }: LocationPickerProps) {
  const { getCurrentLocation, isLoading } = useGeolocation();
  const [manualEntry, setManualEntry] = useState(false);

  const handleGetLocation = async () => {
    try {
      const location = await getCurrentLocation();
      onChange(location);
    } catch (e) {
      console.error('Failed to get location:', e);
    }
  };

  const handleManualChange = (field: 'lat' | 'lng', val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange({
        lat: field === 'lat' ? num : (value?.lat || 0),
        lng: field === 'lng' ? num : (value?.lng || 0),
        address: value?.address,
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      
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
                  onChange({ lat: 0, lng: 0 });
                  setManualEntry(false);
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
            Use current location
          </Button>

          <button
            type="button"
            onClick={() => setManualEntry(!manualEntry)}
            className="text-xs text-primary hover:underline"
          >
            {manualEntry ? 'Hide manual entry' : 'Enter coordinates manually'}
          </button>

          {manualEntry && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 10.8505"
                  onChange={(e) => handleManualChange('lat', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 76.2711"
                  onChange={(e) => handleManualChange('lng', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}