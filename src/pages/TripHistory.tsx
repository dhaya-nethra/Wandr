import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TripCard } from '@/components/trips/TripCard';
import { TripForm } from '@/components/trips/TripForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
import { Trip, TRAVEL_MODES, TRIP_PURPOSES, TravelMode, TripPurpose } from '@/types/trip';
import { TravelModeIcon } from '@/components/trips/TravelModeIcon';
import { MapPin, Trash2, Download, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function TripHistory() {
  const { trips, isLoading, clearAllTrips, deleteTrip } = useTrips();
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Filter state
  const [filterMode, setFilterMode] = useState<TravelMode | 'all'>('all');
  const [filterPurpose, setFilterPurpose] = useState<TripPurpose | 'all'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const hasFilters = filterMode !== 'all' || filterPurpose !== 'all' || filterDateFrom || filterDateTo;

  const clearFilters = () => {
    setFilterMode('all');
    setFilterPurpose('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const handleExport = () => {
    const data = JSON.stringify(trips, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wandr-trips-${new Date().toISOString().split('T')[0]}.json`;
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

  const handleDelete = (id: string) => {
    deleteTrip(id);
    toast.success('Trip deleted');
  };

  // Apply filters
  const filteredTrips = [...trips]
    .reverse()
    .filter((t) => {
      if (filterMode !== 'all' && t.mode !== filterMode) return false;
      if (filterPurpose !== 'all' && t.purpose !== filterPurpose) return false;
      if (filterDateFrom && t.startTime < filterDateFrom) return false;
      if (filterDateTo && t.startTime > filterDateTo + 'T23:59') return false;
      return true;
    });

  return (
    <AppLayout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Trip History</h1>
            <p className="text-sm text-muted-foreground">
              {filteredTrips.length} of {trips.length} trip{trips.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {trips.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
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
                        This will permanently delete all {trips.length} recorded trips. This action cannot be undone.
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

        {/* Filter Bar */}
        <div className="px-4 pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={filterMode} onValueChange={(v) => setFilterMode(v as TravelMode | 'all')}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="All Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                {TRAVEL_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex items-center gap-2">
                      <TravelModeIcon mode={m.value} className="h-3.5 w-3.5 text-primary" />
                      <span>{m.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPurpose} onValueChange={(v) => setFilterPurpose(v as TripPurpose | 'all')}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="All Purposes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purposes</SelectItem>
                {TRIP_PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-8 text-xs flex-1"
              placeholder="From date"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-8 text-xs flex-1"
              placeholder="To date"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredTrips.length > 0 ? (
          filteredTrips.map((trip, index) => (
            <div key={trip.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <TripCard
                trip={trip}
                onEdit={setEditingTrip}
                onDelete={handleDelete}
              />
            </div>
          ))
        ) : (
          <Card className="shadow-card animate-slide-up">
            <CardContent className="py-12 text-center">
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              {hasFilters ? (
                <>
                  <h3 className="text-lg font-semibold text-foreground mb-1">No trips match filters</h3>
                  <Button variant="outline" className="mt-2" onClick={clearFilters}>Clear Filters</Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-foreground mb-1">No trips yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start recording your travels to help improve transportation in Kerala
                  </p>
                  <Link to="/new-trip">
                    <Button className="gradient-primary">Record Your First Trip</Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Trip Dialog */}
      <Dialog open={!!editingTrip} onOpenChange={(open) => !open && setEditingTrip(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trip #{editingTrip?.tripNumber}</DialogTitle>
          </DialogHeader>
          {editingTrip && (
            <TripForm trip={editingTrip} onSuccess={() => setEditingTrip(null)} />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

