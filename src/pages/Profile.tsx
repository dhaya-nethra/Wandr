import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useConsent } from '@/hooks/useConsent';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { User, Shield, Database, MapPin, ExternalLink, LogOut, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { hasConsent, revokeConsent } = useConsent();
  const { participantId, logout } = useAuth();
  const { trips, clearAllTrips } = useTrips();
  const { trackingEnabled, setTracking } = useLocationTracking();

  const handleTrackingToggle = async (enabled: boolean) => {
    await setTracking(enabled);
    toast.success(enabled ? 'Location tracking enabled' : 'Location tracking disabled');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRevokeConsent = () => {
    revokeConsent();
    clearAllTrips();
    toast.success('Consent revoked and data cleared');
    navigate('/');
  };

  const totalDistance = trips.reduce((acc, t) => acc + t.distance, 0);
  const totalCost = trips.reduce((acc, t) => acc + t.cost, 0);

  return (
    <AppLayout>
      {/* Header */}
      <div className="gradient-primary px-6 pt-8 pb-12">
        <div className="flex items-center gap-4 animate-slide-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card/20 backdrop-blur">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">{participantId || 'Survey Participant'}</h1>
            <p className="text-sm text-primary-foreground/80">
              Contributing to Kerala transport research
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4 pb-4">
        {/* Data Summary */}
        <Card className="shadow-elevated animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Your Contribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{trips.length}</p>
                <p className="text-xs text-muted-foreground">Trips</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalDistance.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Km</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">₹{totalCost}</p>
                <p className="text-xs text-muted-foreground">Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Tracking */}
        <Card className="shadow-card animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              Location Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Enable Location Tracking</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Auto-detect trip origin via GPS when starting a new trip
                </p>
              </div>
              <Switch
                checked={trackingEnabled}
                onCheckedChange={handleTrackingToggle}
              />
            </div>
            {!trackingEnabled && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                GPS auto-fill is disabled. You can still enter locations manually.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Consent Status */}
        <Card className="shadow-card animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-secondary" />
              Privacy & Consent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Data sharing consent</span>
              <span className={`text-sm font-medium ${hasConsent ? 'text-success' : 'text-destructive'}`}>
                {hasConsent ? 'Granted' : 'Not granted'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your travel data is anonymized and used solely for transportation 
              research by NATPAC. You can revoke consent at any time.
            </p>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleRevokeConsent}
            >
              Revoke Consent & Clear Data
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="shadow-card animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              About NATPAC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The National Transportation Planning and Research Centre (NATPAC) is 
              Kerala's premier institution for transportation research, working under 
              the Kerala State Council for Science, Technology and Environment.
            </p>
            <Button variant="outline" className="w-full gap-2" asChild>
              <a 
                href="https://natpac.kerala.gov.in" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Visit NATPAC Website
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center py-4 animate-slide-up">
          <p className="text-xs text-muted-foreground">
            Wandr App v1.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            For Government of Kerala • KSCSTE
          </p>
        </div>
      </div>
    </AppLayout>
  );
}