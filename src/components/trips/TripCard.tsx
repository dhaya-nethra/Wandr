import { Trip, TRAVEL_MODES, TRIP_PURPOSES } from '@/types/trip';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, Route, Users, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
}

export function TripCard({ trip, onClick }: TripCardProps) {
  const mode = TRAVEL_MODES.find(m => m.value === trip.mode);
  const purpose = TRIP_PURPOSES.find(p => p.value === trip.purpose);

  return (
    <Card 
      className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer animate-slide-up"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
            {mode?.icon || '🚐'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate">
                Trip #{trip.tripNumber}
              </h3>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(trip.createdAt), 'MMM d')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {purpose?.label || 'Trip'}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">
                  {trip.origin.address?.split(',')[0] || `${trip.origin.lat.toFixed(4)}, ${trip.origin.lng.toFixed(4)}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5 text-secondary" />
                <span>{trip.distance.toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>{format(new Date(trip.startTime), 'h:mm a')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-secondary" />
                <span>{trip.companions + 1} people</span>
              </div>
            </div>

            {trip.cost > 0 && (
              <div className="mt-2 flex items-center gap-1 text-sm font-medium text-foreground">
                <IndianRupee className="h-3.5 w-3.5" />
                <span>{trip.cost}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}