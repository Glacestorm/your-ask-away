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
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Don't render if not visible and not in edit mode
  if (!isVisible && !isEditMode) {
    return null;
  }

  // Normal render without drag functionality
  if (!isEditMode) {
    return <>{children}</>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'z-50 opacity-50',
        'ring-2 ring-primary/30 rounded-lg p-1',
        !isVisible && 'opacity-40'
      )}
    >
      {/* Drag handle and controls */}
      <div className="absolute -top-3 left-4 z-20 flex items-center gap-1 bg-primary text-primary-foreground rounded-md shadow-lg px-2 py-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-primary-foreground/20 rounded touch-none"
          aria-label="Arrastrar widget"
          type="button"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {onToggleVisibility && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleVisibility();
            }}
            aria-label={isVisible ? 'Ocultar widget' : 'Mostrar widget'}
          >
            {isVisible ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      
      {/* Widget content - disable pointer events during edit mode */}
      <div className={cn(isEditMode && 'pointer-events-none select-none')}>
        {children}
      </div>
    </div>
  );
}
