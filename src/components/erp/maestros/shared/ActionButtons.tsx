/**
 * Botones de acción reutilizables para filas de tabla
 * @version 2.0 - Mejoras: Loading states, confirmación integrada, más acciones, keyboard nav
 */

import React, { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Eye, 
  Copy, 
  Archive,
  RotateCcw,
  Download,
  Share2,
  Star,
  StarOff,
  Lock,
  Unlock,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActionType = 
  | 'view' 
  | 'edit' 
  | 'delete' 
  | 'duplicate' 
  | 'archive' 
  | 'restore'
  | 'download'
  | 'share'
  | 'favorite'
  | 'unfavorite'
  | 'lock'
  | 'unlock'
  | 'openExternal';

export interface ActionConfig {
  type: ActionType;
  label?: string;
  icon?: React.ElementType;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  hidden?: boolean;
  destructive?: boolean;
  requireConfirmation?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  shortcut?: string;
}

export interface ActionButtonsProps {
  // Legacy props (backwards compatible)
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  // New flexible actions
  actions?: ActionConfig[];
  // State
  isArchived?: boolean;
  isFavorite?: boolean;
  isLocked?: boolean;
  isLoading?: boolean;
  loadingAction?: ActionType;
  // Display
  showDropdown?: boolean;
  maxInlineActions?: number;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  // Confirmation
  deleteConfirmTitle?: string;
  deleteConfirmDescription?: string;
}

const defaultActionConfig: Record<ActionType, { icon: React.ElementType; label: string; destructive?: boolean }> = {
  view: { icon: Eye, label: 'Ver detalles' },
  edit: { icon: Edit, label: 'Editar' },
  delete: { icon: Trash2, label: 'Eliminar', destructive: true },
  duplicate: { icon: Copy, label: 'Duplicar' },
  archive: { icon: Archive, label: 'Archivar' },
  restore: { icon: RotateCcw, label: 'Restaurar' },
  download: { icon: Download, label: 'Descargar' },
  share: { icon: Share2, label: 'Compartir' },
  favorite: { icon: Star, label: 'Añadir a favoritos' },
  unfavorite: { icon: StarOff, label: 'Quitar de favoritos' },
  lock: { icon: Lock, label: 'Bloquear' },
  unlock: { icon: Unlock, label: 'Desbloquear' },
  openExternal: { icon: ExternalLink, label: 'Abrir en nueva pestaña' },
};

const sizeConfig = {
  sm: { icon: 'h-3.5 w-3.5', button: 'h-7 w-7' },
  default: { icon: 'h-4 w-4', button: 'h-8 w-8' },
  lg: { icon: 'h-5 w-5', button: 'h-9 w-9' },
};

export const ActionButtons = memo(function ActionButtons({
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onArchive,
  onRestore,
  actions: customActions,
  isArchived = false,
  isFavorite = false,
  isLocked = false,
  isLoading = false,
  loadingAction,
  showDropdown = false,
  maxInlineActions = 2,
  size = 'default',
  variant = 'ghost',
  className,
  deleteConfirmTitle = '¿Eliminar este elemento?',
  deleteConfirmDescription = 'Esta acción no se puede deshacer. El elemento será eliminado permanentemente.',
}: ActionButtonsProps) {
  const [confirmAction, setConfirmAction] = useState<ActionConfig | null>(null);
  const [actionLoading, setActionLoading] = useState<ActionType | null>(null);

  const { icon: iconSize, button: buttonSize } = sizeConfig[size];

  // Build actions from legacy props or custom actions
  const actions: ActionConfig[] = customActions || [
    onView && { type: 'view' as const, onClick: onView },
    onEdit && { type: 'edit' as const, onClick: onEdit },
    onDuplicate && { type: 'duplicate' as const, onClick: onDuplicate },
    !isArchived && onArchive && { type: 'archive' as const, onClick: onArchive },
    isArchived && onRestore && { type: 'restore' as const, onClick: onRestore },
    onDelete && { 
      type: 'delete' as const, 
      onClick: onDelete, 
      requireConfirmation: true,
      confirmTitle: deleteConfirmTitle,
      confirmDescription: deleteConfirmDescription,
    },
  ].filter(Boolean) as ActionConfig[];

  const visibleActions = actions.filter(a => !a.hidden);

  const handleActionClick = useCallback(async (action: ActionConfig) => {
    if (action.requireConfirmation || action.destructive) {
      setConfirmAction(action);
      return;
    }

    try {
      setActionLoading(action.type);
      await action.onClick();
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmAction) return;

    try {
      setActionLoading(confirmAction.type);
      await confirmAction.onClick();
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  }, [confirmAction]);

  const getActionConfig = (action: ActionConfig) => {
    const defaults = defaultActionConfig[action.type];
    return {
      icon: action.icon || defaults.icon,
      label: action.label || defaults.label,
      destructive: action.destructive ?? defaults.destructive,
    };
  };

  const isActionLoading = (type: ActionType) => 
    isLoading || loadingAction === type || actionLoading === type;

  // Render confirmation dialog
  const renderConfirmDialog = () => {
    if (!confirmAction) return null;
    const config = getActionConfig(confirmAction);

    return (
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.confirmTitle || `¿${config.label}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.confirmDescription || 'Esta acción requiere confirmación.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={!!actionLoading}
              className={cn(config.destructive && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                config.label
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  // If more than maxInlineActions or showDropdown is true, use dropdown
  if (showDropdown || visibleActions.length > maxInlineActions) {
    const primaryActions = visibleActions.filter(a => !getActionConfig(a).destructive);
    const destructiveActions = visibleActions.filter(a => getActionConfig(a).destructive);

    return (
      <>
        {renderConfirmDialog()}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={variant} 
              size="icon" 
              className={cn(buttonSize, className)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className={cn(iconSize, 'animate-spin')} />
              ) : (
                <MoreHorizontal className={iconSize} />
              )}
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {primaryActions.map((action) => {
              const config = getActionConfig(action);
              const Icon = config.icon;
              const loading = isActionLoading(action.type);

              return (
                <DropdownMenuItem 
                  key={action.type}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled || loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {config.label}
                  {action.shortcut && (
                    <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              );
            })}
            {destructiveActions.length > 0 && primaryActions.length > 0 && (
              <DropdownMenuSeparator />
            )}
            {destructiveActions.map((action) => {
              const config = getActionConfig(action);
              const Icon = config.icon;
              const loading = isActionLoading(action.type);

              return (
                <DropdownMenuItem 
                  key={action.type}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled || loading}
                  className="text-destructive focus:text-destructive"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {config.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  // Render inline buttons
  return (
    <>
      {renderConfirmDialog()}
      <TooltipProvider delayDuration={300}>
        <div className={cn("flex items-center gap-1", className)}>
          {visibleActions.map((action) => {
            const config = getActionConfig(action);
            const Icon = config.icon;
            const loading = isActionLoading(action.type);

            return (
              <Tooltip key={action.type}>
                <TooltipTrigger asChild>
                  <Button 
                    variant={variant}
                    size="icon" 
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled || loading}
                    className={cn(
                      buttonSize,
                      config.destructive && 'text-destructive hover:text-destructive hover:bg-destructive/10'
                    )}
                  >
                    {loading ? (
                      <Loader2 className={cn(iconSize, 'animate-spin')} />
                    ) : (
                      <Icon className={iconSize} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{config.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </>
  );
});

export default ActionButtons;
