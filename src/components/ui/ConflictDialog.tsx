import React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { ConflictInfo } from '@/hooks/useOptimisticLock';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

interface ConflictDialogProps {
  conflict: ConflictInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReload: () => void;
  onForceUpdate: () => void;
  isUpdating?: boolean;
}

export function ConflictDialog({
  conflict,
  open,
  onOpenChange,
  onReload,
  onForceUpdate,
  isUpdating = false,
}: ConflictDialogProps) {
  if (!conflict) return null;

  const formatDate = (date: Date) => {
    return format(date, "d 'de' MMMM 'a les' HH:mm:ss", { locale: ca });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle>Conflicte d'Edició</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              Aquest registre ha estat modificat per un altre usuari mentre
              l'estaves editant.
            </p>

            <div className="rounded-md bg-muted p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">La teva versió:</span>
                <Badge variant="outline">
                  {formatDate(conflict.localVersion)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versió actual:</span>
                <Badge variant="secondary">
                  {formatDate(conflict.serverVersion)}
                </Badge>
              </div>
            </div>

            <p className="text-sm">
              Pots <strong>recarregar</strong> per veure els canvis més recents,
              o <strong>forçar el guardaàt</strong> per sobreescriure amb els
              teus canvis.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isUpdating}>Cancel·lar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onReload}
            disabled={isUpdating}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recarregar
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onForceUpdate}
            disabled={isUpdating}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isUpdating ? 'Guardant...' : 'Forçar Guardat'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
