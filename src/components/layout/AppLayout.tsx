import { ReactNode } from 'react';
import { MobileNav } from './MobileNav';

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen page-bg">
      <main className={showNav ? 'pb-16' : ''}>
        {children}
      </main>
      {showNav && <MobileNav />}
    </div>
  );
}