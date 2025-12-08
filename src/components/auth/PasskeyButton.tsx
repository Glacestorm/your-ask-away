import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2, KeyRound } from 'lucide-react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { cn } from '@/lib/utils';

interface PasskeyButtonProps {
  mode: 'login' | 'register';
  userEmail?: string;
  userId?: string;
  userName?: string;
  onSuccess?: () => void;
  className?: string;
  disabled?: boolean;
}

export function PasskeyButton({
  mode,
  userEmail = '',
  userId = '',
  userName = '',
  onSuccess,
  className,
  disabled = false,
}: PasskeyButtonProps) {
  const { 
    isSupported, 
    isRegistering, 
    isAuthenticating, 
    registerPasskey, 
    authenticateWithPasskey 
  } = useWebAuthn();

  const isLoading = isRegistering || isAuthenticating;

  if (!isSupported) {
    return null;
  }

  const handleClick = async () => {
    if (mode === 'register') {
      if (!userId || !userEmail) return;
      const success = await registerPasskey(userId, userEmail, userName);
      if (success && onSuccess) onSuccess();
    } else {
      const success = await authenticateWithPasskey(userEmail);
      if (success && onSuccess) onSuccess();
    }
  };

  return (
    <Button
      type="button"
      variant={mode === 'login' ? 'outline' : 'secondary'}
      onClick={handleClick}
      disabled={disabled || isLoading || (mode === 'register' && (!userId || !userEmail))}
      className={cn(
        'w-full gap-2 transition-all',
        mode === 'login' && 'border-primary/20 hover:border-primary/50 hover:bg-primary/5',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : mode === 'login' ? (
        <Fingerprint className="h-4 w-4" />
      ) : (
        <KeyRound className="h-4 w-4" />
      )}
      {mode === 'login' 
        ? 'Iniciar amb Passkey' 
        : isRegistering 
          ? 'Registrant...' 
          : 'Afegir Passkey'
      }
    </Button>
  );
}
