import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldAlert, ShieldCheck, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepUpAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: { factor: string; description: string }[];
  challengeType: string;
  expiresAt: string;
  isVerifying: boolean;
  error: string | null;
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
}

export function StepUpAuthDialog({
  open,
  onOpenChange,
  riskLevel,
  riskScore,
  riskFactors,
  challengeType,
  expiresAt,
  isVerifying,
  error,
  onVerify,
  onCancel
}: StepUpAuthDialogProps) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (code.length !== 6) {
      setLocalError('El código debe tener 6 dígitos');
      return;
    }

    const success = await onVerify(code);
    if (success) {
      setCode('');
      onOpenChange(false);
    }
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return <ShieldAlert className="h-8 w-8" />;
      default:
        return <Shield className="h-8 w-8" />;
    }
  };

  const expiresDate = new Date(expiresAt);
  const now = new Date();
  const remainingSeconds = Math.max(0, Math.floor((expiresDate.getTime() - now.getTime()) / 1000));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("p-2 rounded-lg", getRiskColor())}>
              {getRiskIcon()}
            </div>
            <div>
              <DialogTitle>Verificación de Seguridad</DialogTitle>
              <DialogDescription>
                Se requiere autenticación adicional
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Risk Score Indicator */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Nivel de riesgo</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all",
                    riskLevel === 'critical' ? 'bg-red-500' :
                    riskLevel === 'high' ? 'bg-orange-500' :
                    riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  )}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
              <span className={cn("text-sm font-medium capitalize", getRiskColor().split(' ')[0])}>
                {riskLevel === 'critical' ? 'Crítico' :
                 riskLevel === 'high' ? 'Alto' :
                 riskLevel === 'medium' ? 'Medio' : 'Bajo'}
              </span>
            </div>
          </div>

          {/* Risk Factors */}
          {riskFactors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Factores detectados:</Label>
              <div className="space-y-1">
                {riskFactors.slice(0, 3).map((factor, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span>{factor.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OTP Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-code">
                {challengeType === 'otp_email' 
                  ? 'Código enviado a tu email'
                  : 'Código de verificación'}
              </Label>
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-widest font-mono"
                autoComplete="one-time-code"
                disabled={isVerifying}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Introduce el código de 6 dígitos</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            {(error || localError) && (
              <Alert variant="destructive">
                <AlertDescription>{error || localError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={isVerifying}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verificar
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Esta verificación adicional protege tu cuenta según las 
            normativas PSD2/PSD3 (SCA).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
