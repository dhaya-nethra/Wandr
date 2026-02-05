import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useConsent } from '@/hooks/useConsent';
import { MapPin, Shield, Database, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Location Tracking',
    description: 'Capture trip origin and destination coordinates with user consent',
  },
  {
    icon: Database,
    title: 'Trip Data Collection',
    description: 'Record travel mode, distance, purpose, and cost information',
  },
  {
    icon: Shield,
    title: 'Privacy Protected',
    description: 'Your data is used solely for transportation planning research',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { grantConsent } = useConsent();
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    grantConsent();
    navigate('/dashboard');
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
            Kerala Transportation Planning & Research
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8">
        <Card className="shadow-elevated animate-slide-up">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Welcome to the Travel Data App
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Help improve transportation planning in Kerala by sharing your travel patterns. 
              Your data contributes to better roads, public transit, and urban planning.
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Consent Section */}
        <div className="mt-6 space-y-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer">
                  I consent to share my travel data with NATPAC for transportation 
                  research and planning purposes. I understand my data will be 
                  anonymized and used solely for improving public infrastructure.
                </label>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleContinue}
            disabled={!agreed}
            className="w-full h-12 text-base font-medium gradient-primary"
          >
            Get Started
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-center text-xs text-muted-foreground pb-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}