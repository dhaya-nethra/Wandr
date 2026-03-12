import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

type Preference = 'ask-always' | 'remember';

interface LocationPermissionDialogProps {
  open: boolean;
  onAllow: (remember: boolean) => void;
  onDeny: (remember: boolean) => void;
  onDismiss: () => void;
}

export function LocationPermissionDialog({
  open,
  onAllow,
  onDeny,
  onDismiss,
}: LocationPermissionDialogProps) {
  const [preference, setPreference] = useState<Preference>('ask-always');
  const remember = preference === 'remember';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDismiss(); }}>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Allow Location Access?</DialogTitle>
          <DialogDescription className="text-center text-sm">
            This app needs your location to accurately record trip origins and
            destinations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Yes / No buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onDeny(remember)}
            >
              No
            </Button>
            <Button
              className="flex-1"
              onClick={() => onAllow(remember)}
            >
              Yes
            </Button>
          </div>

          {/* Preference option at the bottom */}
          <RadioGroup
            value={preference}
            onValueChange={(val) => setPreference(val as Preference)}
            className="space-y-2"
          >
            <label
              htmlFor="perm-ask-always"
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
                preference === 'ask-always' && 'border-primary bg-primary/5',
              )}
            >
              <RadioGroupItem value="ask-always" id="perm-ask-always" />
              <div>
                <p className="text-sm font-medium leading-none">Ask always</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Show this prompt each time
                </p>
              </div>
            </label>

            <label
              htmlFor="perm-remember"
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
                preference === 'remember' && 'border-primary bg-primary/5',
              )}
            >
              <RadioGroupItem value="remember" id="perm-remember" />
              <div>
                <p className="text-sm font-medium leading-none">
                  Remember my choice
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Don't ask again on this device
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
