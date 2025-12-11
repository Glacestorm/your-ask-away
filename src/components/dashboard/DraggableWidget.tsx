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
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!isVisible && !isEditMode) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50 opacity-90 scale-[1.02]',
        isEditMode && 'ring-2 ring-primary/20 rounded-lg',
        !isVisible && isEditMode && 'opacity-50'
      )}
    >
      {isEditMode && (
        <div className="absolute -top-2 -left-2 z-10 flex items-center gap-1 bg-background border border-border rounded-md shadow-sm p-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
            aria-label="Arrastrar widget"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {onToggleVisibility && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onToggleVisibility}
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
      )}
      <div className={cn(isEditMode && 'pointer-events-none')}>
        {children}
      </div>
    </div>
  );
}
