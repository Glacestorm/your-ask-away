/**
 * Componente de estado vacío reutilizable
 * @version 1.0 - Con variantes, acciones y animaciones
 */

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Search, 
  FileX, 
  Users, 
  ShoppingCart,
  FolderOpen,
  Inbox,
  AlertCircle,
  Plus,
  RefreshCw,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type EmptyStateVariant = 
  | 'default'
  | 'search'
  | 'noData'
  | 'noResults'
  | 'noUsers'
  | 'noProducts'
  | 'noFiles'
  | 'error';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: EmptyStateAction[];
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  animated?: boolean;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: React.ElementType;
  title: string;
  description: string;
  iconClassName: string;
}> = {
  default: {
    icon: Inbox,
    title: 'Sin datos',
    description: 'No hay elementos para mostrar.',
    iconClassName: 'text-muted-foreground',
  },
  search: {
    icon: Search,
    title: 'Sin resultados',
    description: 'No se encontraron elementos que coincidan con tu búsqueda.',
    iconClassName: 'text-muted-foreground',
  },
  noData: {
    icon: FolderOpen,
    title: 'Sin datos',
    description: 'Aún no hay datos registrados.',
    iconClassName: 'text-muted-foreground',
  },
  noResults: {
    icon: FileX,
    title: 'Sin resultados',
    description: 'Intenta ajustar los filtros o términos de búsqueda.',
    iconClassName: 'text-muted-foreground',
  },
  noUsers: {
    icon: Users,
    title: 'Sin usuarios',
    description: 'No hay usuarios registrados todavía.',
    iconClassName: 'text-blue-500',
  },
  noProducts: {
    icon: Package,
    title: 'Sin productos',
    description: 'No hay productos en el catálogo.',
    iconClassName: 'text-purple-500',
  },
  noFiles: {
    icon: Upload,
    title: 'Sin archivos',
    description: 'No hay archivos cargados.',
    iconClassName: 'text-green-500',
  },
  error: {
    icon: AlertCircle,
    title: 'Error al cargar',
    description: 'Hubo un problema al cargar los datos.',
    iconClassName: 'text-destructive',
  },
};

const sizeConfig = {
  sm: {
    container: 'py-6',
    icon: 'h-10 w-10',
    iconWrapper: 'h-16 w-16',
    title: 'text-base',
    description: 'text-sm',
  },
  default: {
    container: 'py-12',
    icon: 'h-12 w-12',
    iconWrapper: 'h-20 w-20',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 'h-16 w-16',
    iconWrapper: 'h-24 w-24',
    title: 'text-xl',
    description: 'text-base',
  },
};

export const EmptyState = memo(function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  actions = [],
  className,
  size = 'default',
  animated = true,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizes.container,
      className
    )}>
      {/* Icon */}
      <div className={cn(
        'flex items-center justify-center rounded-full bg-muted/50 mb-4',
        sizes.iconWrapper,
        animated && 'animate-in fade-in-50 zoom-in-95 duration-300'
      )}>
        {icon || (
          <Icon className={cn(sizes.icon, config.iconClassName)} strokeWidth={1.5} />
        )}
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-foreground mb-1',
        sizes.title,
        animated && 'animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-100'
      )}>
        {title || config.title}
      </h3>

      {/* Description */}
      <p className={cn(
        'text-muted-foreground max-w-sm',
        sizes.description,
        animated && 'animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-150'
      )}>
        {description || config.description}
      </p>

      {/* Actions */}
      {actions.length > 0 && (
        <div className={cn(
          'flex items-center gap-2 mt-6',
          animated && 'animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-200'
        )}>
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || (index === 0 ? 'default' : 'outline')}
                onClick={action.onClick}
                size={size === 'sm' ? 'sm' : 'default'}
              >
                {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
});

// Preset components for common use cases
export const NoSearchResults = memo(function NoSearchResults({
  onClear,
  searchTerm,
}: {
  onClear?: () => void;
  searchTerm?: string;
}) {
  return (
    <EmptyState
      variant="search"
      description={searchTerm 
        ? `No se encontraron resultados para "${searchTerm}"`
        : 'No se encontraron resultados'
      }
      actions={onClear ? [
        { label: 'Limpiar búsqueda', onClick: onClear, icon: RefreshCw, variant: 'outline' }
      ] : []}
    />
  );
});

export const NoDataYet = memo(function NoDataYet({
  entityName = 'elementos',
  onAdd,
}: {
  entityName?: string;
  onAdd?: () => void;
}) {
  return (
    <EmptyState
      variant="noData"
      title={`Sin ${entityName}`}
      description={`Aún no hay ${entityName} registrados. ¡Crea el primero!`}
      actions={onAdd ? [
        { label: `Añadir ${entityName.slice(0, -1) || 'elemento'}`, onClick: onAdd, icon: Plus }
      ] : []}
    />
  );
});

export const LoadError = memo(function LoadError({
  onRetry,
  message,
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <EmptyState
      variant="error"
      description={message || 'Hubo un problema al cargar los datos. Por favor, intenta de nuevo.'}
      actions={onRetry ? [
        { label: 'Reintentar', onClick: onRetry, icon: RefreshCw }
      ] : []}
    />
  );
});

export default EmptyState;