import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConsent } from '@/hooks/useConsent';

const Index = () => {
  const navigate = useNavigate();
  const { hasConsent, isLoading } = useConsent();

  useEffect(() => {
    if (!isLoading) {
      if (hasConsent) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [hasConsent, isLoading, navigate]);

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
