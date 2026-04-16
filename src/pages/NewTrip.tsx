import { AppLayout } from '@/components/layout/AppLayout';
import { TripForm } from '@/components/trips/TripForm';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewTrip() {
  return (
    <AppLayout>
      <div className="app-header sticky top-0 z-10">
        <div className="flex items-center gap-3 px-5 py-3">
          <Link
            to="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-700 hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <p className="font-display text-[15px] font-bold text-white leading-none">Record a trip</p>
            <p className="text-[11px] text-blue-200 mt-0.5">Fill in what you remember</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6">
        <TripForm />
      </div>
    </AppLayout>
  );
}