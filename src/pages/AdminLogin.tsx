import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { DEMO_MASTER_KEY } from '@/lib/adminStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  KeyRound,
  User,
} from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading } = useAdminAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [govKey, setGovKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGovKey, setShowGovKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();
    const ok = await login(username.trim(), password, govKey.trim());
    setIsSubmitting(false);
    if (ok) {
      navigate('/admin/dashboard');
    }
  };

  const fillDemo = (role: 'admin' | 'scientist' | 'super') => {
    const creds = {
      admin:     { u: 'natpac_admin',     p: 'NATPAC@Kerala2024' },
      scientist: { u: 'natpac_scientist', p: 'Science@Kerala24' },
      super:     { u: 'natpac_super',     p: 'Super@NATPAC2024' },
    }[role];
    setUsername(creds.u);
    setPassword(creds.p);
    setGovKey(DEMO_MASTER_KEY);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 px-6 pt-10 pb-14 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/20 border border-yellow-500/40">
          <ShieldCheck className="h-8 w-8 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">NATPAC Admin Portal</h1>
        <p className="mt-1 text-sm text-slate-400">
          Restricted access · Kerala Government Transport Research
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-xs">
            <Lock className="h-3 w-3 mr-1" /> End-to-End Encrypted
          </Badge>
          <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
            AES-256-GCM
          </Badge>
        </div>
      </div>

      <div className="px-6 -mt-8 pb-8 max-w-md mx-auto w-full">
        {/* Security notice */}
        <Alert className="mb-4 border-yellow-500/40 bg-yellow-50/50 dark:bg-yellow-900/10">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-300">
            This portal requires a valid <strong>Government Access Key</strong> issued by NATPAC.
            Unauthorised access attempts are logged and prosecuted.
          </AlertDescription>
        </Alert>

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Administrator Sign In</CardTitle>
            <CardDescription className="text-xs">
              Three-factor authentication: username · password · government key
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium">Administrator Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); clearError(); }}
                    placeholder="e.g. natpac_admin"
                    className="pl-9 text-sm"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    placeholder="Your secure password"
                    className="pl-9 pr-10 text-sm"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Government Key */}
              <div className="space-y-1.5">
                <Label htmlFor="govkey" className="text-xs font-medium">
                  Government Access Key
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(issued by NATPAC HQ)</span>
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="govkey"
                    type={showGovKey ? 'text' : 'password'}
                    value={govKey}
                    onChange={(e) => { setGovKey(e.target.value); clearError(); }}
                    placeholder="GOV-KERALA-NATPAC-XXXX"
                    className="pl-9 pr-10 text-sm font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowGovKey(!showGovKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showGovKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This key is required to decrypt participant data. Without it, no data can be read.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={isSubmitting || isLoading}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Authenticating…' : 'Authenticate & Enter Portal'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Quick-fill panel */}
        <Card className="mt-4 border-dashed border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Demo Credentials (Development Only)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 space-y-2">
            {[
              { role: 'super' as const, label: 'Super Admin', color: 'bg-red-100 text-red-800 hover:bg-red-200', desc: 'Full access + admin mgmt' },
              { role: 'admin' as const, label: 'NATPAC Admin', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200', desc: 'Full data access + export' },
              { role: 'scientist' as const, label: 'Researcher', color: 'bg-green-100 text-green-800 hover:bg-green-200', desc: 'Anonymised / aggregated only' },
            ].map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => fillDemo(item.role)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${item.color}`}
              >
                <span className="font-semibold">{item.label}</span>
                <span className="ml-2 text-xs opacity-70">{item.desc}</span>
              </button>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-1">
              Click a role above to auto-fill credentials
            </p>
          </CardContent>
        </Card>

        {/* Security architecture note */}
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Security Architecture</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { icon: '🔐', text: 'AES-256-GCM encryption per participant' },
              { icon: '🔑', text: 'Keys derived via PBKDF2 (100K iterations)' },
              { icon: '🏛️', text: 'Government master key never stored on device' },
              { icon: '📋', text: 'Every access action audit-logged (tamper-evident)' },
              { icon: '🚫', text: 'Participants cannot see each other\'s data' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
