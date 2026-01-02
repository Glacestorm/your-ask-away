import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Upload, 
  CheckCircle, 
  Link,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StatementLine {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  is_reconciled: boolean;
  matched_entity_type?: string;
  match_score?: number;
}

interface BankReconciliationProps {
  companyId: string;
}

export function BankReconciliation({ companyId }: BankReconciliationProps) {
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    fetchLines();
  }, [companyId]);

  const fetchLines = async () => {
    try {
      const { data, error } = await supabase
        .from('erp_bank_statement_lines')
        .select(`
          id, transaction_date, description, amount, 
          is_reconciled, matched_entity_type, match_score
        `)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLines(data || []);
    } catch (err) {
      console.error('[BankReconciliation] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAutoReconciliation = async () => {
    setReconciling(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-auto-reconciliation', {
        body: {
          action: 'reconcile',
          company_id: companyId
        }
      });

      if (error) throw error;
      
      toast.success(`Conciliación completada: ${data?.matched || 0} movimientos`);
      fetchLines();
    } catch (err) {
      toast.error('Error en conciliación automática');
    } finally {
      setReconciling(false);
    }
  };

  const pendingCount = lines.filter(l => !l.is_reconciled).length;
  const reconciledCount = lines.filter(l => l.is_reconciled).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total movimientos</p>
          <p className="text-2xl font-bold">{lines.length}</p>
        </Card>
        <Card className="p-4 bg-green-500/5 border-green-500/20">
          <p className="text-xs text-muted-foreground">Conciliados</p>
          <p className="text-2xl font-bold text-green-600">{reconciledCount}</p>
        </Card>
        <Card className={cn("p-4", pendingCount > 0 && "bg-yellow-500/5 border-yellow-500/20")}>
          <p className="text-xs text-muted-foreground">Pendientes</p>
          <p className={cn("text-2xl font-bold", pendingCount > 0 && "text-yellow-600")}>
            {pendingCount}
          </p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar Extracto
        </Button>
        <Button onClick={runAutoReconciliation} disabled={reconciling}>
          {reconciling ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Link className="h-4 w-4 mr-2" />
          )}
          Conciliación Automática
        </Button>
      </div>

      {/* Lines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Movimientos Bancarios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : lines.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No hay movimientos bancarios</p>
              <p className="text-sm text-muted-foreground mt-1">Importa un extracto para comenzar</p>
            </div>
          ) : (
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {lines.map((line) => (
                <div key={line.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">{line.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(line.transaction_date), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className={cn(
                        "font-bold",
                        line.amount >= 0 ? "text-green-600" : "text-destructive"
                      )}>
                        € {Math.abs(line.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                      {line.is_reconciled ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {line.match_score ? `${line.match_score}%` : 'OK'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BankReconciliation;
