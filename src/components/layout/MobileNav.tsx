import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, List, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/new-trip', icon: Plus, label: 'New Trip' },
  { path: '/trips', icon: List, label: 'History' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white">
      <div className="flex items-stretch h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-primary border-t-2 border-primary -mt-px'
                  : 'text-muted-foreground hover:text-foreground border-t-2 border-transparent -mt-px'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-[10px] font-medium tracking-wide uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}