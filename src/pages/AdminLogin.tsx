import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  KeyRound,
  User,
} from 'lucide-react';

const DEMO_MASTER_KEY = 'NATPAC-KERALA-GOV-2026-';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading, isAuthenticated } = useAdminAuth();

  // If already fully authenticated (govMasterKey in memory), skip to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate('/admin/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [govKey, setGovKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGovKey, setShowGovKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCredentials = async (nextUsername: string, nextPassword: string, nextGovKey: string) => {
    setIsSubmitting(true);
    clearError();
    const ok = await login(nextUsername.trim(), nextPassword, nextGovKey.trim());
    setIsSubmitting(false);
    if (ok) {
      navigate('/admin/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCredentials(username, password, govKey);
  };

  const fillDemo = async (role: 'admin' | 'scientist') => {
    const creds = {
      admin:     { u: 'natpac_admin',     p: 'NATPAC@Kerala2024' },
      scientist: { u: 'natpac_scientist', p: 'Science@Kerala24' },
    }[role];
    setUsername(creds.u);
    setPassword(creds.p);
    setGovKey(DEMO_MASTER_KEY);
    await submitCredentials(creds.u, creds.p, DEMO_MASTER_KEY);
  };

  return (
    <div className="min-h-screen page-bg flex flex-col md:flex-row">
      {/* Left — header strip */}
      <div className="app-header px-8 py-10 md:w-[42%] md:min-h-screen md:flex md:flex-col md:justify-between">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-blue-200 hover:text-white text-[13px] transition-colors mb-10"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <p className="label-caps text-blue-200 mb-3">Restricted access</p>
          <h1 className="font-display text-3xl font-extrabold text-white leading-tight tracking-tight">
            Wandr<br/>Admin Portal
          </h1>
          <p className="mt-4 text-[14px] leading-6 text-blue-100/80 max-w-xs">
            Government analytics and participant data workspace for authorised NATPAC personnel only.
          </p>
        </div>
        <div className="hidden md:block mt-12 space-y-2 border-t border-blue-400/30 pt-6">
          {[
            'AES-256-GCM per-participant encryption',
            'Government key never persisted to disk',
            'Every action written to audit log',
          ].map((s) => (
            <div key={s} className="flex items-center gap-2 text-[12px] text-blue-200">
              <div className="h-1 w-1 rounded-full bg-blue-300 shrink-0" />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center flex-1 px-8 py-12 overflow-y-auto">
        <div className="max-w-sm w-full mx-auto md:mx-0">
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">Administrator sign in</h2>
          <p className="text-[13px] text-muted-foreground mb-8">
            Three-factor: username · password · government access key
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[13px] text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[13px] font-medium">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" value={username}
                  onChange={(e) => { setUsername(e.target.value); clearError(); }}
                  placeholder="natpac_admin"
                  className="pl-9 h-11 rounded-sm text-[14px]"
                  autoComplete="off" required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  className="pl-9 pr-10 h-11 rounded-sm text-[14px]"
                  autoComplete="new-password" required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="govkey" className="text-[13px] font-medium">
                Government Access Key
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">issued by NATPAC HQ</span>
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="govkey"
                  type={showGovKey ? 'text' : 'password'}
                  value={govKey}
                  onChange={(e) => { setGovKey(e.target.value); clearError(); }}
                  placeholder="NATPAC-KERALA-GOV-2026-"
                  className="pl-9 pr-10 h-11 rounded-sm text-[14px] font-mono"
                  required
                />
                <button type="button" onClick={() => setShowGovKey(!showGovKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showGovKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[12px] text-muted-foreground">Required to decrypt participant data. Lost keys cannot be recovered.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-primary text-[14px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Authenticate &amp; Enter Portal</>
              )}
            </button>
          </form>

          {/* Demo quick-fill */}
          <div className="mt-8 border-t border-border pt-6">
            <p className="label-caps mb-3">Demo credentials (dev only)</p>
            <div className="space-y-2">
              {[
                { role: 'admin' as const,     label: 'NATPAC Admin',  desc: 'Full data + admin mgmt' },
                { role: 'scientist' as const, label: 'Researcher',    desc: 'Aggregated view only'  },
              ].map((item) => (
                <button key={item.role} type="button" onClick={() => fillDemo(item.role)}
                  className="hover-row w-full flex items-center justify-between rounded-sm border border-border px-3 py-2.5 text-left text-[13px] transition-colors"
                >
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground text-[12px]">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
