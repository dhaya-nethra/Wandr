import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'accent';
}

export function StatsCard({ title, value, subtitle, icon: Icon }: StatsCardProps) {
  return (
    <div className="card-flat shadow-card p-4">
      <div className="flex items-start justify-between">
        <p className="label-caps">{title}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
      <p className="stat-value mt-2">{value}</p>
      {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}