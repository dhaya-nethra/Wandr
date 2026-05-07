import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { TripCard } from '@/components/trips/TripCard';
import { useTrips } from '@/hooks/useTrips';
import { Route, MapPin, Plus, ChevronRight, Navigation, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { trips, isLoading } = useTrips();

  const totalTrips = trips.length;
  const totalDistance = trips.reduce((acc, t) => acc + t.distance, 0);
  const totalCost = trips.reduce((acc, t) => acc + t.cost, 0);
  const recentTrips = trips.slice(-3).reverse();

  return (
    <AppLayout>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="app-header px-5 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <p className="font-display text-[17px] font-bold text-white leading-none">Wandr</p>
            <p className="text-[11px] text-blue-200 mt-0.5">NATPAC Mobility Survey</p>
          </div>
          <Link
            to="/new-trip"
            className="flex items-center gap-1.5 rounded-sm bg-slate-700 hover:bg-slate-800 px-3 py-1.5 text-[13px] font-medium text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New trip
          </Link>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-5xl mx-auto px-5 py-4 grid grid-cols-4 divide-x divide-border">
          {[
            { label: 'Trips',    value: totalTrips },
            { label: 'Distance', value: `${totalDistance.toFixed(1)} km` },
            { label: 'Avg / trip', value: totalTrips > 0 ? `${(totalDistance / totalTrips).toFixed(1)} km` : '—' },
            { label: 'Spend',    value: `₹${totalCost}` },
          ].map((s) => (
            <div key={s.label} className="px-4 first:pl-0">
              <p className="label-caps">{s.label}</p>
              <p className="stat-value mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/new-trip" className="group card-flat shadow-card hover:shadow-panel transition-all p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 border border-primary/15">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">Record trip</p>
              <p className="text-[12px] text-muted-foreground">Log manually</p>
            </div>
          </Link>
          <Link to="/active-trip" className="group card-flat shadow-card hover:shadow-panel transition-all p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-100 border border-slate-200">
              <Navigation className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">Auto detect</p>
              <p className="text-[12px] text-muted-foreground">GPS tracking</p>
            </div>
          </Link>
        </div>

        {/* Recent trips */}
        <div className="card-flat shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="font-display text-[15px] font-semibold text-foreground">Recent trips</p>
            {trips.length > 0 && (
              <Link to="/trips" className="link-underline text-[13px] text-primary flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          <div>
            {isLoading ? (
              <div className="flex items-center gap-2 px-5 py-6 text-[13px] text-muted-foreground">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading trips…
              </div>
            ) : recentTrips.length > 0 ? (
              <div className="divide-y divide-border">
                {recentTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <Route className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-[14px] font-medium text-foreground">No trips yet</p>
                <p className="text-[13px] text-muted-foreground mt-1">Add your first trip to start contributing travel data.</p>
                <Link to="/new-trip" className="inline-flex items-center gap-1.5 mt-4 text-[13px] font-medium text-primary link-underline">
                  Record your first trip <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Why contribute */}
        <div className="card-inset px-5 py-4 flex items-start gap-4">
          <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-foreground">Why your trips matter</p>
            <p className="text-[13px] text-muted-foreground mt-0.5 leading-5">
              Aggregated travel data helps NATPAC identify congestion patterns, plan transit routes, and improve road infrastructure across Kerala.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}