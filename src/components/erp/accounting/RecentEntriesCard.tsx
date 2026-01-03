/**
 * RecentEntriesCard - Tarjeta de últimos asientos con funcionalidad de limpieza
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Receipt, Trash2, Loader2 } from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  status: 'draft' | 'posted' | 'reversed';
  total_debit: number;
}

interface RecentEntriesCardProps {
  entries: JournalEntry[];
  formatCurrency: (amount: number) => string;
  onClean: () => void;
}

export function RecentEntriesCard({ entries, formatCurrency, onClean }: RecentEntriesCardProps) {
  const { currentCompany } = useERPContext();
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const draftEntries = entries.filter(e => e.status === 'draft');
  const hasDrafts = draftEntries.length > 0;

  const handleClearDrafts = async () => {
    if (!currentCompany?.id) {
      toast.error('Seleccione una empresa');
      return;
    }

    setIsClearing(true);
    try {
      const draftIds = draftEntries.map(e => e.id);
      
      if (draftIds.length > 0) {
        // Eliminar líneas de cada asiento
        for (const entryId of draftIds) {
          await (supabase
            .from('erp_journal_entry_lines') as any)
            .delete()
            .eq('journal_entry_id', entryId);
        }

        // Eliminar asientos borrador
        const { error: entriesError } = await (supabase
          .from('erp_journal_entries') as any)
          .delete()
          .eq('company_id', currentCompany.id)
          .eq('status', 'draft');

        if (entriesError) throw entriesError;
      }

      toast.success(`${draftEntries.length} asientos borrador eliminados`);
      setShowConfirm(false);
      onClean();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al limpiar';
      toast.error(message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Últimos Asientos
            <HelpTooltip
              type="definition"
              title="Asientos Contables"
              content="Registro de las operaciones económicas según el principio de partida doble: todo cargo tiene un abono de igual importe."
              regulationRef="PGC - Principios Contables"
            />
          </CardTitle>
          
          {hasDrafts && (
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar Borradores ({draftEntries.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar asientos borrador?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminarán <strong>{draftEntries.length}</strong> asientos con estado "Borrador". 
                    Esta acción no afecta a los asientos contabilizados y no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isClearing}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearDrafts}
                    disabled={isClearing}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isClearing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar Borradores
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    entry.status === 'posted' ? 'bg-green-500' : 'bg-amber-500'
                  )} />
                  <div>
                    <p className="font-medium text-sm">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.entry_number} • {format(new Date(entry.entry_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {formatCurrency(entry.total_debit)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {entry.status === 'posted' ? 'Contabilizado' : 'Borrador'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No hay asientos recientes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentEntriesCard;
