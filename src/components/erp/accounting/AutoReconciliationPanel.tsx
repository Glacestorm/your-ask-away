/**
 * AutoReconciliationPanel - Panel de conciliación bancaria automática con IA
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Link2,
  Unlink,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReconciliationMatch {
  id: string;
  bank_transaction: {
    date: string;
    description: string;
    amount: number;
  };
  accounting_entry: {
    entry_number: string;
    description: string;
    amount: number;
  };
  confidence: number;
  match_type: 'exact' | 'fuzzy' | 'suggested';
  status: 'pending' | 'confirmed' | 'rejected';
}

interface ReconciliationSummary {
  total_bank_transactions: number;
  total_accounting_entries: number;
  matched: number;
  unmatched_bank: number;
  unmatched_accounting: number;
  reconciliation_rate: number;
}

interface AutoReconciliationPanelProps {
  className?: string;
}

export function AutoReconciliationPanel({ className }: AutoReconciliationPanelProps) {
  const { currentCompany } = useERPContext();
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);

  const handleRunReconciliation = useCallback(async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('erp-auto-reconciliation', {
        body: {
          action: 'run_reconciliation',
          params: {
            company_id: currentCompany.id
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setMatches(data.matches || []);
        setSummary(data.summary);
        toast.success(`Conciliación completada: ${data.summary?.matched || 0} coincidencias`);
      }
    } catch (err) {
      console.error('[AutoReconciliationPanel] Error:', err);
      toast.error('Error en la conciliación');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const handleConfirmMatch = useCallback(async (matchId: string) => {
    setMatches(prev => prev.map(m => 
      m.id === matchId ? { ...m, status: 'confirmed' as const } : m
    ));
    toast.success('Coincidencia confirmada');
  }, []);

  const handleRejectMatch = useCallback(async (matchId: string) => {
    setMatches(prev => prev.map(m => 
      m.id === matchId ? { ...m, status: 'rejected' as const } : m
    ));
    toast.info('Coincidencia rechazada');
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCompany?.currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getMatchTypeColor = (type: ReconciliationMatch['match_type']) => {
    switch (type) {
      case 'exact': return 'bg-green-600 text-white';
      case 'fuzzy': return 'bg-yellow-500 text-white';
      case 'suggested': return 'bg-blue-500 text-white';
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600">
              <ArrowLeftRight className="h-4 w-4 text-white" />
            </div>
            Conciliación Bancaria IA
            <HelpTooltip
              type="tip"
              title="Conciliación Automática"
              content="La IA cruza automáticamente los movimientos bancarios con los asientos contables usando algoritmos de matching avanzados."
            />
          </CardTitle>
          <Button
            onClick={handleRunReconciliation}
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Conciliar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {summary && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                <Link2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-xl font-bold text-green-600">{summary.matched}</p>
                <p className="text-xs text-muted-foreground">Conciliados</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-center">
                <Wallet className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                <p className="text-xl font-bold text-orange-600">{summary.unmatched_bank}</p>
                <p className="text-xs text-muted-foreground">Banco sin cruzar</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
                <FileCheck className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-xl font-bold text-blue-600">{summary.unmatched_accounting}</p>
                <p className="text-xs text-muted-foreground">Contab. sin cruzar</p>
              </div>
            </div>
            
            {/* Reconciliation Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Tasa de conciliación</span>
                <span className="font-medium">{summary.reconciliation_rate}%</span>
              </div>
              <Progress 
                value={summary.reconciliation_rate} 
                className={cn(
                  "h-2",
                  summary.reconciliation_rate >= 90 && "[&>div]:bg-green-600",
                  summary.reconciliation_rate >= 70 && summary.reconciliation_rate < 90 && "[&>div]:bg-yellow-500",
                  summary.reconciliation_rate < 70 && "[&>div]:bg-orange-500"
                )}
              />
            </div>
          </div>
        )}

        {/* Matches List */}
        {matches.length > 0 ? (
          <ScrollArea className="h-[220px]">
            <div className="space-y-2 pr-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    match.status === 'confirmed' && 'bg-green-50/50 dark:bg-green-950/20 border-green-200',
                    match.status === 'rejected' && 'bg-red-50/50 dark:bg-red-950/20 border-red-200',
                    match.status === 'pending' && 'bg-card'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Bank Transaction */}
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <Wallet className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{match.bank_transaction.description}</span>
                        <span className="font-mono font-medium">
                          {formatCurrency(match.bank_transaction.amount)}
                        </span>
                      </div>
                      {/* Arrow */}
                      <ArrowLeftRight className="h-3 w-3 text-muted-foreground my-1 ml-1" />
                      {/* Accounting Entry */}
                      <div className="flex items-center gap-2 text-xs">
                        <FileCheck className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">{match.accounting_entry.entry_number}</span>
                        <span className="truncate">{match.accounting_entry.description}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={cn("text-xs", getMatchTypeColor(match.match_type))}>
                        {match.confidence}%
                      </Badge>
                      {match.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleConfirmMatch(match.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleRejectMatch(match.id)}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                      {match.status === 'confirmed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {match.status === 'rejected' && (
                        <Unlink className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ejecuta la conciliación para ver coincidencias</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AutoReconciliationPanel;
