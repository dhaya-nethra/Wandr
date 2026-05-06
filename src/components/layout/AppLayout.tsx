import { ReactNode, useState } from 'react';
import { MobileNav } from './MobileNav';
import { useConsent } from '@/hooks/useConsent';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  const { hasConsent, grantConsent, isLoading: consentLoading } = useConsent();
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGrant = async () => {
    setIsProcessing(true);
    await grantConsent();
    setIsProcessing(false);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen page-bg">
      <main className={showNav ? 'pb-16' : ''}>
        {children}
      </main>
      {showNav && <MobileNav />}

      {/* Consent Enforcement Modal */}
      {isLoggedIn && hasConsent === false && !consentLoading && (
        <Dialog open={true}>
          <DialogContent className="sm:max-w-md [&>button]:hidden">
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center">Consent Required</DialogTitle>
              <DialogDescription className="text-center">
                Your research consent was revoked or is missing. To continue using Wandr and contributing to NATPAC research, please re-grant your consent.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button 
                onClick={handleGrant} 
                disabled={isProcessing}
                className="w-full gradient-primary"
              >
                {isProcessing ? 'Processing...' : 'Grant Consent'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="w-full text-muted-foreground"
              >
                Sign Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}