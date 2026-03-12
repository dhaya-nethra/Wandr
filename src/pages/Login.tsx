import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useConsent } from '@/hooks/useConsent';
import { MapPin, LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { hasConsent } = useConsent();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name or participant ID');
      return;
    }
    setIsLoading(true);
    await login(name.trim());
    if (hasConsent) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="gradient-primary px-6 pt-12 pb-16 text-center">
        <div className="animate-slide-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-card/20 backdrop-blur">
            <MapPin className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">
            NATPAC Travel Survey
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/80">
            Kerala Transportation Planning &amp; Research
          </p>
        </div>
      </div>

      {/* Login Form */}
      <div className="px-6 -mt-8">
        <Card className="shadow-elevated animate-slide-up">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Sign In
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your name or participant ID to continue
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name / Participant ID</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name or ID"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  className={error ? 'border-destructive' : ''}
                  autoFocus
                />
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                <LogIn className="h-4 w-4" />
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your data is used solely for transportation research by NATPAC
        </p>
      </div>
    </div>
  );
}
