/**
 * Diálogo de confirmación reutilizable
 * @version 1.0 - Soporta diferentes variantes y estados de carga
 */

import React, { memo, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  Trash2, 
  Info, 
  CheckCircle,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmationVariant = 'default' | 'destructive' | 'warning' | 'info' | 'success';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  variant?: ConfirmationVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  // Type-to-confirm para acciones críticas
  requireTypedConfirmation?: boolean;
  confirmationText?: string;
  confirmationPlaceholder?: string;
  // Estado
  isLoading?: boolean;
  // Iconos personalizados
  icon?: React.ReactNode;
}

const variantConfig: Record<ConfirmationVariant, {
  icon: React.ElementType;
  iconClassName: string;
  actionClassName: string;
}> = {
  default: {
    icon: Info,
    iconClassName: 'text-primary bg-primary/10',
    actionClassName: '',
  },
  destructive: {
    icon: Trash2,
    iconClassName: 'text-destructive bg-destructive/10',
    actionClassName: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
    actionClassName: 'bg-amber-600 text-white hover:bg-amber-700',
  },
  info: {
    icon: Info,
    iconClassName: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    actionClassName: 'bg-blue-600 text-white hover:bg-blue-700',
  },
  success: {
    icon: CheckCircle,
    iconClassName: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    actionClassName: 'bg-green-600 text-white hover:bg-green-700',
  },
};

export const ConfirmationDialog = memo(function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  variant = 'default',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  requireTypedConfirmation = false,
  confirmationText = 'CONFIRMAR',
  confirmationPlaceholder,
  isLoading = false,
  icon,
}: ConfirmationDialogProps) {
  const [typedValue, setTypedValue] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const isConfirmDisabled = requireTypedConfirmation 
    ? typedValue !== confirmationText 
    : false;

  const loading = isLoading || internalLoading;

  const handleConfirm = useCallback(async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      setTypedValue('');
      onOpenChange(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setInternalLoading(false);
    }
  }, [onConfirm, onOpenChange]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setTypedValue('');
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn(
              'flex-shrink-0 p-2 rounded-full',
              config.iconClassName
            )}>
              {icon || <Icon className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-left">
                {title}
              </AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="text-left mt-2">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        {requireTypedConfirmation && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="confirmation-input" className="text-sm text-muted-foreground">
              Escribe <span className="font-mono font-bold text-foreground">{confirmationText}</span> para confirmar
            </Label>
            <Input
              id="confirmation-input"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={confirmationPlaceholder || `Escribe "${confirmationText}"`}
              className="font-mono"
              disabled={loading}
              autoComplete="off"
            />
          </div>
        )}

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isConfirmDisabled || loading}
            className={cn(config.actionClassName)}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

export default ConfirmationDialog;