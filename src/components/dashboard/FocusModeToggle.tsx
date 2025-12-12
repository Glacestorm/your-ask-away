import React from 'react';
import { Button } from '@/components/ui/button';
import { Focus, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusModeToggleProps {
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export function FocusModeToggle({ isActive, onToggle, className }: FocusModeToggleProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className={cn("gap-2", className)}
    >
      {isActive ? (
        <>
          <Maximize2 className="h-4 w-4" />
          <span className="hidden sm:inline">Vista Completa</span>
        </>
      ) : (
        <>
          <Focus className="h-4 w-4" />
          <span className="hidden sm:inline">Modo Foco</span>
        </>
      )}
    </Button>
  );
}
