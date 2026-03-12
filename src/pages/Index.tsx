import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConsent } from '@/hooks/useConsent';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { hasConsent, isLoading: consentLoading } = useConsent();
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const isLoading = consentLoading || authLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        navigate('/login');
      } else if (hasConsent) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [isLoggedIn, hasConsent, isLoading, navigate]);

  // Loading state while checking consent
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
