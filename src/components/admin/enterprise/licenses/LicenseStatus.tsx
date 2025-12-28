/**
 * LicenseStatus - Componente de estado de licencia compacto
 * Fase 5 - Enterprise SaaS 2025-2026
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Monitor
} from 'lucide-react';
import { useLicenseClient } from '@/hooks/admin/enterprise/useLicenseClient';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface LicenseStatusProps {
  variant?: 'compact' | 'full' | 'minimal';
  showActions?: boolean;
  onDeactivated?: () => void;
  className?: string;
}

export function LicenseStatus({ 
  variant = 'compact',
  showActions = true,
  onDeactivated,
  className 
}: LicenseStatusProps) {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const {
    state,
    isLoading,
    isValid,
    isActivated,
    remainingDays,
    validateLicense,
    deactivateLicense,
    checkOfflineValidity
  } = useLicenseClient();

  const isOnline = navigator.onLine;
  const isOfflineValid = checkOfflineValidity();

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    await deactivateLicense();
    setIsDeactivating(false);
    setShowDeactivateDialog(false);
    onDeactivated?.();
  };

  const getStatusConfig = () => {
    if (!isActivated) {
      return {
        icon: ShieldX,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
        borderColor: 'border-muted',
        label: 'Sin licencia',
        description: 'Activa una licencia para acceder'
      };
    }

    if (!isValid) {
      if (isOfflineValid) {
        return {
          icon: ShieldAlert,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          label: 'Modo Offline',
          description: 'Validación pendiente'
        };
      }
      return {
        icon: ShieldX,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        label: 'Licencia inválida',
        description: 'Verifica tu licencia'
      };
    }

    if (remainingDays !== null && remainingDays <= 7) {
      return {
        icon: ShieldAlert,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        label: 'Por expirar',
        description: `${remainingDays} días restantes`
      };
    }

    return {
      icon: ShieldCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      label: 'Licencia activa',
      description: state.plan?.toUpperCase() || 'Standard'
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  // === MINIMAL VARIANT ===
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <StatusIcon className={cn("h-4 w-4", config.color)} />
        <span className="text-sm">{config.label}</span>
      </div>
    );
  }

  // === COMPACT VARIANT ===
  if (variant === 'compact') {
    return (
      <>
        <div 
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
            config.bgColor,
            config.borderColor,
            className
          )}
          onClick={() => showActions && isActivated && setShowDeactivateDialog(true)}
        >
          <StatusIcon className={cn("h-5 w-5", config.color)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{config.label}</p>
            <p className="text-xs text-muted-foreground truncate">
              {config.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-yellow-500" />
            )}
            {showActions && isActivated && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Deactivate Dialog */}
        <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Desactivar Licencia
              </DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas desactivar la licencia en este dispositivo?
                Podrás reactivarla en cualquier momento.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeactivateDialog(false)}
                disabled={isDeactivating}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={isDeactivating}
              >
                {isDeactivating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Desactivando...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Desactivar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // === FULL VARIANT ===
  return (
    <Card className={cn(config.bgColor, config.borderColor, className)}>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-lg", config.bgColor)}>
              <StatusIcon className={cn("h-6 w-6", config.color)} />
            </div>
            <div>
              <h3 className="font-semibold">{config.label}</h3>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn(config.color, config.borderColor)}
          >
            {state.plan?.toUpperCase() || 'FREE'}
          </Badge>
        </div>

        {/* Details */}
        {isActivated && (
          <div className="space-y-3">
            {/* Expiration Progress */}
            {remainingDays !== null && state.expiresAt && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vigencia</span>
                  <span className="font-medium">{remainingDays} días restantes</span>
                </div>
                <Progress 
                  value={Math.min((remainingDays / 365) * 100, 100)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Expira: {new Date(state.expiresAt).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Features */}
            {state.features.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Funcionalidades incluidas:</p>
                <div className="flex flex-wrap gap-1">
                  {state.features.slice(0, 5).map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {state.features.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{state.features.length - 5} más
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Device Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                Este dispositivo
              </div>
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-yellow-500" />
                    Offline
                  </>
                )}
              </div>
              {state.lastValidated && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Validado {formatDistanceToNow(new Date(state.lastValidated), { 
                    locale: es, 
                    addSuffix: true 
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => validateLicense(true)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <RefreshCw className={cn(
                    "h-4 w-4 mr-2",
                    isLoading && "animate-spin"
                  )} />
                  Revalidar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeactivateDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Not activated state */}
        {!isActivated && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Activa una licencia para desbloquear funcionalidades premium
            </p>
            <Button variant="default" size="sm" asChild>
              <a href="/store">Obtener Licencia</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LicenseStatus;
