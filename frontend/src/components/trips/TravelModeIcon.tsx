import { TravelMode } from '@/types/trip';
import { cn } from '@/lib/utils';

interface TravelModeIconProps {
  mode: TravelMode;
  className?: string;
}

/* ── Custom SVG paths for modes not in lucide ─────────────────────────── */

function WalkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="4" r="1.5" />
      <path d="M9 9.5 12 7l3 2.5" />
      <path d="M10 13l-2 5h2.5l1.5-3 1.5 3H16l-2-5" />
      <path d="M10.5 13l-1.5-3.5" />
      <path d="M13.5 13l1.5-3.5" />
    </svg>
  );
}

function BikeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="5.5" cy="16" r="3" />
      <circle cx="18.5" cy="16" r="3" />
      <path d="M5.5 16 10 8h4" />
      <path d="M14 8l4.5 8" />
      <path d="M10 8h4l1.5-3h2" />
      <circle cx="16" cy="5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function MotorcycleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="4.5" cy="15.5" r="2.5" />
      <circle cx="19.5" cy="15.5" r="2.5" />
      <path d="M4.5 15.5h2l2-5h6l2 5h1.5" />
      <path d="M10.5 10.5 9 7h3l2 3.5" />
      <path d="M17 10.5h2.5l1 2" />
    </svg>
  );
}

function AutoRickshawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M5 17H3v-5l3-4h9l2 4v5H9" />
      <path d="M15 12H6" />
      <path d="M12 8v4" />
      <path d="M18 12l2-1v3" />
    </svg>
  );
}

function BusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="5" width="18" height="13" rx="2" />
      <circle cx="7.5" cy="18" r="1.5" />
      <circle cx="16.5" cy="18" r="1.5" />
      <path d="M3 11h18" />
      <path d="M8 5v6" />
      <path d="M16 5v6" />
      <path d="M3 8h2" />
      <path d="M19 8h2" />
    </svg>
  );
}

function TrainIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="3" width="16" height="15" rx="2" />
      <circle cx="8.5" cy="18.5" r="1.5" />
      <circle cx="15.5" cy="18.5" r="1.5" />
      <path d="M4 11h16" />
      <path d="M12 3v8" />
      <path d="M8.5 20l-1.5 1.5" />
      <path d="M15.5 20l1.5 1.5" />
    </svg>
  );
}

function MetroIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <circle cx="8" cy="18" r="1.5" />
      <circle cx="16" cy="18" r="1.5" />
      <path d="M3 10h18" />
      <path d="M8 4v6" />
      <path d="M16 4v6" />
      <path d="M7 7h2" />
      <path d="M15 7h2" />
      <path d="M8 20H16" />
    </svg>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 17H3v-4l2.5-5h11L19 13v4h-2" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
      <path d="M5.5 13h13" />
      <path d="M7 8.5h10" />
    </svg>
  );
}

function TaxiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 5h6l1 3H8L9 5Z" />
      <path d="M5 17H3v-4l2.5-5h11L19 13v4h-2" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
      <path d="M5.5 13h13" />
    </svg>
  );
}

function OtherIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="8" width="20" height="10" rx="2" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M2 13h20" />
      <path d="M7 8V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

const iconMap: Record<TravelMode, (props: { className?: string }) => JSX.Element> = {
  walk: WalkIcon,
  bicycle: BikeIcon,
  motorcycle: MotorcycleIcon,
  auto_rickshaw: AutoRickshawIcon,
  bus: BusIcon,
  train: TrainIcon,
  metro: MetroIcon,
  car: CarIcon,
  taxi: TaxiIcon,
  other: OtherIcon,
};

export function TravelModeIcon({ mode, className }: TravelModeIconProps) {
  const Icon = iconMap[mode] ?? OtherIcon;
  return <Icon className={cn('h-5 w-5', className)} />;
}
