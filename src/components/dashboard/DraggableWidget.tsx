import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  isEditMode: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export function DraggableWidget({
  id,
  children,
  isEditMode,
  isVisible = true,
  onToggleVisibility,
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Si no es visible y no estamos en modo edición, no renderizar
  if (!isVisible && !isEditMode) {
    return null;
  }

  // Si no estamos en modo edición, renderizar sin funcionalidad de drag
  if (!isEditMode) {
    return <div>{children}</div>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'relative',
        isDragging && 'z-50 opacity-70 scale-[1.02]',
        'ring-2 ring-primary/20 rounded-lg',
        !isVisible && 'opacity-50'
      )}
    >
      <div className="absolute -top-2 -left-2 z-10 flex items-center gap-1 bg-background border border-border rounded-md shadow-sm p-1">
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
          aria-label="Arrastrar widget"
          type="button"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        {onToggleVisibility && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            aria-label={isVisible ? 'Ocultar widget' : 'Mostrar widget'}
          >
            {isVisible ? (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
      <div className="pointer-events-none">
        {children}
      </div>
    </div>
  );
}
