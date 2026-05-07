import { Trip, TRAVEL_MODES, TRIP_PURPOSES } from '@/types/trip';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Route, Users, IndianRupee, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { TravelModeIcon } from './TravelModeIcon';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
  onEdit?: (trip: Trip) => void;
  onDelete?: (id: string) => void;
}

export function TripCard({ trip, onClick, onEdit, onDelete }: TripCardProps) {
  const mode = TRAVEL_MODES.find(m => m.value === trip.mode);
  const purpose = TRIP_PURPOSES.find(p => p.value === trip.purpose);

  return (
    <div
      className={`hover-row px-5 py-4 flex items-start gap-4 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Mode icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary/8 border border-primary/15 mt-0.5">
        <TravelModeIcon mode={trip.mode} className="h-4 w-4 text-primary" />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display text-[14px] font-semibold text-foreground truncate">
              {purpose?.label || 'Trip'} · #{trip.tripNumber}
            </span>
            {trip.needsDetails && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-destructive/25 bg-destructive/8 px-1.5 py-0.5 text-[10px] font-medium text-destructive uppercase tracking-wide shrink-0">
                <AlertCircle className="h-2.5 w-2.5" /> Incomplete
              </span>
            )}
          </div>
          <span className="label-caps shrink-0">{format(new Date(trip.createdAt), 'MMM d')}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            {trip.origin.address?.split(',')[0] || `${trip.origin.lat.toFixed(3)}, ${trip.origin.lng.toFixed(3)}`}
          </span>
          <span className="flex items-center gap-1">
            <Route className="h-3 w-3" />
            {trip.distance.toFixed(1)} km
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(trip.startTime), 'h:mm a')}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {trip.companions + 1} {trip.companions + 1 === 1 ? 'person' : 'people'}
          </span>
          {trip.cost > 0 && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <IndianRupee className="h-3 w-3" />{trip.cost}
            </span>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="mt-2.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button onClick={() => onEdit(trip)}
                className="flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[12px] font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete trip record?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this trip record from your history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(trip.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

