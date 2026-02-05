import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TripCard } from '@/components/trips/TripCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useTrips } from '@/hooks/useTrips';
import { MapPin, Trash2, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function TripHistory() {
  const { trips, isLoading, clearAllTrips } = useTrips();
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  const handleExport = () => {
    const data = JSON.stringify(trips, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `natpac-trips-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Trip data exported successfully');
  };

  const handleClearAll = () => {
    clearAllTrips();
    toast.success('All trips cleared');
  };

  const sortedTrips = [...trips].reverse();

  return (
    <AppLayout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Trip History</h1>
            <p className="text-sm text-muted-foreground">
              {trips.length} trip{trips.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <div className="flex items-center gap-2">
            {trips.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all trips?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {trips.length} recorded trips. 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAll}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sortedTrips.length > 0 ? (
          sortedTrips.map((trip, index) => (
            <div 
              key={trip.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TripCard 
                trip={trip} 
                onClick={() => setSelectedTrip(trip.id === selectedTrip ? null : trip.id)}
              />
            </div>
          ))
        ) : (
          <Card className="shadow-card animate-slide-up">
            <CardContent className="py-12 text-center">
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No trips yet</h3>
              <p className="text-muted-foreground mb-4">
                Start recording your travels to help improve transportation in Kerala
              </p>
              <Link to="/new-trip">
                <Button className="gradient-primary">
                  Record Your First Trip
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}