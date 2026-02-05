import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationPicker } from './LocationPicker';
import { useTrips } from '@/hooks/useTrips';
import { 
  TravelMode, 
  TripPurpose, 
  TripFrequency, 
  TRAVEL_MODES, 
  TRIP_PURPOSES, 
  TRIP_FREQUENCIES 
} from '@/types/trip';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export function TripForm() {
  const navigate = useNavigate();
  const { saveTrip } = useTrips();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [mode, setMode] = useState<TravelMode | ''>('');
  const [distance, setDistance] = useState('');
  const [purpose, setPurpose] = useState<TripPurpose | ''>('');
  const [companions, setCompanions] = useState('0');
  const [frequency, setFrequency] = useState<TripFrequency | ''>('');
  const [cost, setCost] = useState('0');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!origin || (origin.lat === 0 && origin.lng === 0)) {
      newErrors.origin = 'Origin location is required';
    }
    if (!destination || (destination.lat === 0 && destination.lng === 0)) {
      newErrors.destination = 'Destination location is required';
    }
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!endTime) newErrors.endTime = 'End time is required';
    if (!mode) newErrors.mode = 'Travel mode is required';
    if (!distance || parseFloat(distance) <= 0) {
      newErrors.distance = 'Valid distance is required';
    }
    if (!purpose) newErrors.purpose = 'Trip purpose is required';
    if (!frequency) newErrors.frequency = 'Trip frequency is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      saveTrip({
        origin: origin!,
        destination: destination!,
        startTime,
        endTime,
        mode: mode as TravelMode,
        distance: parseFloat(distance),
        purpose: purpose as TripPurpose,
        companions: parseInt(companions) || 0,
        frequency: frequency as TripFrequency,
        cost: parseFloat(cost) || 0,
      });

      toast.success('Trip recorded successfully!');
      navigate('/trips');
    } catch (error) {
      toast.error('Failed to save trip');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      {/* Location Section */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Location Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocationPicker
            label="Origin"
            value={origin}
            onChange={setOrigin}
            error={errors.origin}
          />
          <LocationPicker
            label="Destination"
            value={destination}
            onChange={setDestination}
            error={errors.destination}
          />
        </CardContent>
      </Card>

      {/* Time & Mode Section */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Time & Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={errors.startTime ? 'border-destructive' : ''}
              />
              {errors.startTime && (
                <p className="text-xs text-destructive">{errors.startTime}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={errors.endTime ? 'border-destructive' : ''}
              />
              {errors.endTime && (
                <p className="text-xs text-destructive">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mode of Travel</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as TravelMode)}>
              <SelectTrigger className={errors.mode ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {TRAVEL_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <span className="flex items-center gap-2">
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.mode && (
              <p className="text-xs text-destructive">{errors.mode}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Distance (km)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="e.g. 5.5"
              className={errors.distance ? 'border-destructive' : ''}
            />
            {errors.distance && (
              <p className="text-xs text-destructive">{errors.distance}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trip Details Section */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Trip Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Trip Purpose</Label>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as TripPurpose)}>
              <SelectTrigger className={errors.purpose ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                {TRIP_PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.purpose && (
              <p className="text-xs text-destructive">{errors.purpose}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Number of Companions</Label>
            <Input
              type="number"
              min="0"
              max="50"
              value={companions}
              onChange={(e) => setCompanions(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Number of people traveling with you (excluding yourself)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Trip Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as TripFrequency)}>
              <SelectTrigger className={errors.frequency ? 'border-destructive' : ''}>
                <SelectValue placeholder="How often do you make this trip?" />
              </SelectTrigger>
              <SelectContent>
                {TRIP_FREQUENCIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.frequency && (
              <p className="text-xs text-destructive">{errors.frequency}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cost Incurred (₹)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Total travel cost for this trip
            </p>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full h-12 text-base font-medium gradient-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Trip'
        )}
      </Button>
    </form>
  );
}