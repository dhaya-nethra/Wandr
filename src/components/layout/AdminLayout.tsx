/**
 * AdminLayout — Government portal layout for NATPAC admins/scientists.
 *
 * Visually distinct from the participant AppLayout:
 *  • Deep blue top navbar (no bottom nav)
 *  • Role-colored accent stripe (blue = ADMIN, slate = SCIENTIST)
 *  • Desktop sidebar on lg+ screens
 *  • No gradient-primary header, no mobile bottom navigation
 */

import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth, AdminRole } from '@/hooks/useAdminAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BarChart3,
  LogOut,
  Lock,
  Menu,
  X,
  Building2,
} from 'lucide-react';

const ROLE_CONFIG: Record<AdminRole, { label: string; badgeCls: string }> = {
  ADMIN: {
    label: 'Administrator',
    badgeCls: 'bg-sky-600 hover:bg-sky-600 text-white',
  },
  SCIENTIST: {
    label: 'Researcher',
    badgeCls: 'bg-slate-600 hover:bg-slate-600 text-white',
  },
};

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/analytics', label: 'Analytics',  icon: BarChart3 },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { session, logout } = useAdminAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const role   = (session?.role ?? 'ADMIN') as AdminRole;
  const config = ROLE_CONFIG[role];

  return (
    <div className="min-h-screen flex flex-col page-bg">
      {/* ── Top navigation bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-sky-900/30 shadow-lg shadow-black/20" style={{ backgroundColor: '#1656AD' }}>
        <div className="flex items-center gap-3 px-4 h-12">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-500 bg-slate-700">
              <img src="/Wandr_favicon.ico" alt="Wandr" className="h-5 w-5 rounded-sm" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-white text-xs font-bold tracking-wide">WANDR</span>
              <span className="text-blue-100/55 text-[9px] tracking-widest uppercase">Gov Portal</span>
            </div>
          </div>

          <div className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />

          {/* Desktop nav links */}
          <nav className="hidden sm:flex items-center gap-0.5 flex-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-200 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex h-8 w-8 items-center justify-center rounded border border-transparent text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          {/* Right side: role badge + user + logout */}
          <div className="ml-auto flex items-center gap-2">
            {session && (
              <>
                <Badge className={`text-[10px] px-2 py-0.5 ${config.badgeCls} hidden md:flex`}>
                  {config.label}
                </Badge>
                <span className="hidden font-mono text-xs text-blue-100/70 lg:block">
                  {session.adminId}
                </span>
                <div className="hidden h-5 w-px bg-white/15 md:block" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                  className="h-7 gap-1.5 px-2 text-xs text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="sm:hidden space-y-1 border-t border-slate-500 bg-slate-800 px-4 py-2">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active ? 'bg-slate-700 text-white' : 'text-slate-200 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            {session && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <div className="flex items-center gap-2 px-3 pb-2">
                  <Badge className={`text-[10px] ${config.badgeCls}`}>{config.label}</Badge>
                  <span className="text-xs font-mono text-blue-100/70">{session.adminId}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Role accent stripe ─────────────────────────────────────────── */}
      {session && (
        <div className="border-b border-border bg-white px-5 py-2 flex items-center gap-2 shrink-0">
          <Lock className="h-3 w-3 shrink-0 text-primary" />
          <p className="truncate text-[12px] text-muted-foreground">
            Signed in as{' '}
            <strong className="text-foreground font-semibold">{session.adminId}</strong>
            {' '}·{' '}
            <span className="text-primary font-medium">{config.label}</span>
            {' '}· Expires{' '}
            <strong className="text-foreground">{new Date(session.expiresAt).toLocaleTimeString()}</strong>
            {' '}· All actions are audit-logged
            {role === 'SCIENTIST' && ' · Anonymised data only'}
          </p>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <Building2 className="h-3 w-3 text-muted-foreground/50" />
            <span className="hidden text-[11px] text-muted-foreground/70 sm:block">Government of Kerala</span>
          </div>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1 page-bg">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="flex items-center justify-between border-t border-border bg-white px-6 py-2">
        <span className="text-[11px] text-muted-foreground">
          NATPAC · Department of Transport · Government of Kerala
        </span>
        <span className="text-[11px] text-muted-foreground">
          AES-256-GCM · End-to-End Encrypted
        </span>
      </footer>
    </div>
  );
}
