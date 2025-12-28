/**
 * LicenseActivation - Componente de activación de licencia para usuarios
 * Fase 5 - Enterprise SaaS 2025-2026
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Lock
} from 'lucide-react';
import { useLicenseClient } from '@/hooks/admin/enterprise/useLicenseClient';
import { cn } from '@/lib/utils';

interface LicenseActivationProps {
  onActivated?: () => void;
  showBranding?: boolean;
  className?: string;
}

export function LicenseActivation({ 
  onActivated, 
  showBranding = true,
  className 
}: LicenseActivationProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const { 
    activateLicense, 
    isLoading, 
    error,
    isActivated,
    state
  } = useLicenseClient();

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;

    const result = await activateLicense(licenseKey.trim());
    
    if (result.success) {
      setLicenseKey('');
      setShowConfirm(false);
      onActivated?.();
    }
  };

  const formatLicenseKey = (value: string) => {
    // Remove non-alphanumeric characters except hyphens
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    // Auto-format with hyphens every 4 characters
    const parts = cleaned.replace(/-/g, '').match(/.{1,4}/g) || [];
    return parts.join('-').slice(0, 29); // XXXX-XXXX-XXXX-XXXX-XXXX format
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLicenseKey(formatLicenseKey(e.target.value));
  };

  // If already activated, show status instead
  if (isActivated) {
    return (
      <Card className={cn("border-green-500/20 bg-green-500/5", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-700 dark:text-green-400">
                Licencia Activada
              </h3>
              <p className="text-sm text-muted-foreground">
                Plan: {state.plan?.toUpperCase() || 'Standard'}
              </p>
              {state.expiresAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Válida hasta: {new Date(state.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              Activa
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {showBranding && (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Activar Licencia</h2>
              <p className="text-xs text-muted-foreground">
                Desbloquea todas las funcionalidades premium
              </p>
            </div>
          </div>
        </div>
      )}

      <CardHeader className={!showBranding ? '' : 'pt-4'}>
        {!showBranding && (
          <>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Activar Licencia
            </CardTitle>
            <CardDescription>
              Introduce tu clave de licencia para activar el producto
            </CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="license-key">Clave de Licencia</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="license-key"
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={handleKeyChange}
              className="pl-10 font-mono tracking-wider"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && licenseKey.length >= 24) {
                  handleActivate();
                }
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            La clave de licencia se encuentra en el email de compra
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Features Preview */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Al activar tu licencia obtendrás:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 pl-6">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Acceso a todas las funcionalidades
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Soporte prioritario
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Actualizaciones automáticas
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Modo offline (72h)
            </li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button 
          className="w-full" 
          onClick={handleActivate}
          disabled={isLoading || licenseKey.length < 24}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Activando...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Activar Licencia
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          ¿No tienes licencia?{' '}
          <a href="/store" className="text-primary hover:underline">
            Adquiere una aquí
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}

export default LicenseActivation;
