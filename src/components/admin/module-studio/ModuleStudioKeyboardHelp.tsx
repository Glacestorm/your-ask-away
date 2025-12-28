/**
 * ModuleStudioKeyboardHelp - Modal de ayuda de atajos de teclado
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

const shortcuts = [
  {
    category: 'Navegación',
    items: [
      { keys: ['Alt', 'H'], description: 'Ir al Hub' },
      { keys: ['Alt', 'D'], description: 'Ir a Development' },
      { keys: ['Alt', 'O'], description: 'Ir a Operations' },
      { keys: ['Alt', 'A'], description: 'Ir a Analytics' },
      { keys: ['Alt', 'G'], description: 'Ir a Governance' },
      { keys: ['Alt', 'E'], description: 'Ir a Ecosystem' },
    ],
  },
  {
    category: 'Paneles',
    items: [
      { keys: ['Ctrl', 'P'], description: 'Toggle Preview' },
      { keys: ['Ctrl', 'I'], description: 'Toggle Copilot' },
      { keys: ['Ctrl', 'J'], description: 'Toggle Agent' },
    ],
  },
  {
    category: 'Acciones',
    items: [
      { keys: ['Ctrl', 'R'], description: 'Refrescar datos' },
      { keys: ['Ctrl', 'K'], description: 'Buscar módulo' },
      { keys: ['Ctrl', 'S'], description: 'Guardar cambios' },
    ],
  },
];

function KeyCap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[24px] h-6 px-1.5',
        'rounded border border-border bg-muted/50 text-xs font-mono',
        'shadow-[0_2px_0_0] shadow-border/50',
        className
      )}
    >
      {children}
    </kbd>
  );
}

export function ModuleStudioKeyboardHelp() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Atajos de Teclado
          </DialogTitle>
          <DialogDescription>
            Usa estos atajos para navegar más rápido por Module Studio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                {group.category}
              </h4>
              <div className="space-y-2">
                {group.items.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={key} className="flex items-center gap-1">
                          <KeyCap>{key}</KeyCap>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Badge variant="outline" className="gap-1">
            <Keyboard className="h-3 w-3" />
            Presiona ? para ver esta ayuda
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ModuleStudioKeyboardHelp;
