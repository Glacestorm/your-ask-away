/**
 * MFA Enforcement Dialog
 * Prompts admin users to set up MFA
 * Automatically shows when MFA is required
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Fingerprint, Smartphone, Clock, AlertTriangle } from 'lucide-react';
import { useMFAEnforcement } from '@/hooks/useMFAEnforcement';
import { PasskeyManager } from '@/components/auth/PasskeyManager';

export function MFAEnforcementDialog() {
  const { showMFASetup, dismissMFAReminder, completeMFASetup } = useMFAEnforcement();
  const [setupMode, setSetupMode] = useState<'choose' | 'webauthn'>('choose');
  const [isLoading, setIsLoading] = useState(false);
  const [localOpen, setLocalOpen] = useState(true);

  const handlePasskeyRegistered = async () => {
    setIsLoading(true);
    await completeMFASetup('webauthn');
    setIsLoading(false);
    setLocalOpen(false);
  };

  const handleRemindLater = async (hours: number) => {
    setIsLoading(true);
    await dismissMFAReminder(hours);
    setIsLoading(false);
    setLocalOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Allow closing but remind in 1 hour
      handleRemindLater(1);
    }
    setLocalOpen(open);
  };

  // Only show if MFA setup is required and dialog hasn't been dismissed
  if (!showMFASetup || !localOpen) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Autenticació Multifactor Obligatòria
          </DialogTitle>
          <DialogDescription>
            Com a usuari amb rol administratiu, és obligatori configurar MFA.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Requisit ISO 27001 - Control A.8.5
          </AlertDescription>
        </Alert>

        {setupMode === 'choose' && (
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4"
              onClick={() => setSetupMode('webauthn')}
            >
              <Fingerprint className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Clau de Seguretat / Passkey</div>
                <div className="text-xs text-muted-foreground">
                  Empremta digital, Face ID o clau USB
                </div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto py-4" disabled>
              <Smartphone className="h-5 w-5 mr-3 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium text-muted-foreground">TOTP (Properament)</div>
              </div>
            </Button>
          </div>
        )}

        {setupMode === 'webauthn' && (
          <div className="py-4">
            <PasskeyManager />
            <div className="mt-4 flex gap-2">
              <Button variant="default" onClick={handlePasskeyRegistered} disabled={isLoading}>
                He configurat la meva Passkey
              </Button>
              <Button variant="ghost" onClick={() => setSetupMode('choose')}>
                ← Tornar
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={() => handleRemindLater(4)} disabled={isLoading}>
              <Clock className="h-4 w-4 mr-1" /> 4h
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleRemindLater(24)} disabled={isLoading}>
              <Clock className="h-4 w-4 mr-1" /> 24h
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
