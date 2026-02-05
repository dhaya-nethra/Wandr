import { AppLayout } from '@/components/layout/AppLayout';
import { TripForm } from '@/components/trips/TripForm';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewTrip() {
  return (
    <AppLayout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link 
            to="/dashboard" 
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">New Trip</h1>
            <p className="text-sm text-muted-foreground">Record your journey details</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6">
        <TripForm />
      </div>
    </AppLayout>
  );
}