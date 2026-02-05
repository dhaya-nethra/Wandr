import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/trips/StatsCard';
import { TripCard } from '@/components/trips/TripCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrips } from '@/hooks/useTrips';
import { Route, MapPin, Clock, IndianRupee, Plus, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const { trips, isLoading } = useTrips();

  const totalTrips = trips.length;
  const totalDistance = trips.reduce((acc, t) => acc + t.distance, 0);
  const totalCost = trips.reduce((acc, t) => acc + t.cost, 0);
  const recentTrips = trips.slice(-3).reverse();

  return (
    <AppLayout>
      {/* Header */}
      <div className="gradient-primary px-6 pt-8 pb-12">
        <div className="animate-slide-up">
          <p className="text-sm text-primary-foreground/80">Welcome to</p>
          <h1 className="text-2xl font-bold text-primary-foreground">
            NATPAC Travel Survey
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/70">
            Track your daily trips to improve Kerala's transportation
          </p>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-6 pb-4">
        {/* Quick Action */}
        <Link to="/new-trip">
          <Card className="shadow-elevated hover:shadow-card transition-shadow cursor-pointer animate-slide-up overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="flex-1 p-4">
                  <h2 className="font-semibold text-foreground">Record New Trip</h2>
                  <p className="text-sm text-muted-foreground">
                    Tap to log your latest journey
                  </p>
                </div>
                <div className="h-full px-4 flex items-center justify-center bg-primary/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary">
                    <Plus className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="Total Trips"
            value={totalTrips}
            subtitle="recorded"
            icon={Route}
            variant="primary"
          />
          <StatsCard
            title="Distance"
            value={`${totalDistance.toFixed(1)}`}
            subtitle="kilometers"
            icon={MapPin}
            variant="secondary"
          />
          <StatsCard
            title="Travel Cost"
            value={`₹${totalCost}`}
            subtitle="spent"
            icon={IndianRupee}
            variant="accent"
          />
          <StatsCard
            title="Avg. Distance"
            value={totalTrips > 0 ? `${(totalDistance / totalTrips).toFixed(1)}` : '0'}
            subtitle="km/trip"
            icon={Clock}
            variant="primary"
          />
        </div>

        {/* Recent Trips */}
        <Card className="shadow-card animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Trips</CardTitle>
            {trips.length > 0 && (
              <Link to="/trips" className="text-sm text-primary flex items-center gap-1">
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : recentTrips.length > 0 ? (
              recentTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No trips recorded yet</p>
                <Link to="/new-trip">
                  <Button variant="link" className="mt-2">
                    Record your first trip
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="shadow-card border-primary/20 bg-primary/5 animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Why record trips?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your travel data helps NATPAC improve roads, public transit routes, 
                  and urban planning across Kerala.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}