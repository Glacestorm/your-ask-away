import React from 'react';
import { Settings2, RotateCcw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WidgetLayoutControlsProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onReset: () => void;
}

export function WidgetLayoutControls({
  isEditMode,
  onToggleEditMode,
  onReset,
}: WidgetLayoutControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {isEditMode ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onToggleEditMode}
            className="gap-1.5 text-xs"
          >
            <Check className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Guardar</span>
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleEditMode}
          className={cn(
            'gap-1.5 text-xs transition-colors',
            'hover:border-primary hover:text-primary'
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Personalizar</span>
        </Button>
      )}
    </div>
  );
}
