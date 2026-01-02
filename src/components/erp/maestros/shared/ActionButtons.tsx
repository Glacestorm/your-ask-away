/**
 * Botones de acción reutilizables para filas de tabla
 */

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Eye, 
  Copy, 
  Archive,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  isArchived?: boolean;
  showDropdown?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export const ActionButtons = memo(function ActionButtons({
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onArchive,
  onRestore,
  isArchived = false,
  showDropdown = false,
  size = 'default',
  className
}: ActionButtonsProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  // Count available actions
  const actionCount = [onEdit, onDelete, onView, onDuplicate, onArchive, onRestore].filter(Boolean).length;

  // If more than 2 actions or showDropdown is true, use dropdown
  if (showDropdown || actionCount > 2) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cn(buttonSize, className)}>
            <MoreHorizontal className={iconSize} />
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onView && (
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              Ver detalles
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
          )}
          {onDuplicate && (
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
          )}
          {(onArchive || onRestore) && <DropdownMenuSeparator />}
          {onArchive && !isArchived && (
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archivar
            </DropdownMenuItem>
          )}
          {onRestore && isArchived && (
            <DropdownMenuItem onClick={onRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Render inline buttons
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex items-center gap-1", className)}>
        {onView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onView} className={buttonSize}>
                <Eye className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalles</TooltipContent>
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onEdit} className={buttonSize}>
                <Edit className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onDelete} 
                className={cn(buttonSize, "text-destructive hover:text-destructive")}
              >
                <Trash2 className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});

export default ActionButtons;
