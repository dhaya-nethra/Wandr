import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { registerParticipant } from '@/lib/backendApi';
import { checkConsentStatus } from '@/hooks/useConsent';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { login, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, isAuthLoading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Enter your name or participant ID'); return; }
    if (!password.trim()) { setError('Enter a password'); return; }
    if (!/^\d{6}$/.test(password)) { setError('Password must be exactly 6 digits'); return; }
    
    setIsLoading(true);
    try {
      await registerParticipant(name.trim(), password);
      await login(name.trim());
      const consented = await checkConsentStatus(name.trim());
      navigate(consented ? '/dashboard' : '/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setIsLoading(false);
    }
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
          <p className="label-caps text-blue-200 mb-3">Participant access</p>
          <h1 className="font-display text-3xl font-extrabold text-white leading-tight tracking-tight">
            Wandr
          </h1>
          <p className="mt-4 text-[14px] leading-6 text-blue-100/80 max-w-xs">
            Join the Kerala transport planning research by registering a new account.
          </p>
        </div>
        <p className="hidden md:block text-[11px] text-blue-300/60 uppercase tracking-widest mt-12">
          Government of Kerala
        </p>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center flex-1 px-8 py-12">
        <div className="max-w-sm w-full mx-auto md:mx-0">
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">Sign up</h2>
          <p className="text-[13px] text-muted-foreground mb-8">Create a new participant account to start logging trips.</p>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[13px] font-medium">Name or Participant ID</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Priya K. or NATPAC-2026-041"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                className={`h-11 rounded-sm text-[14px] ${error && !name.trim() ? 'border-destructive' : ''}`}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium">Create Password</Label>
              <Input
                id="password"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="6-digit PIN"
                value={password}
                onChange={(e) => { setPassword(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                className={`h-11 rounded-sm text-[14px] ${error && !password.trim() ? 'border-destructive' : ''}`}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Example: 123456</p>
            </div>

            {error && <p className="text-[13px] font-medium text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-primary text-[14px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Create Account <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-[13px] text-center text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>

          <p className="mt-8 text-[12px] text-muted-foreground border-t border-border pt-5">
            Your data is used solely for transportation research by NATPAC and will not be shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
