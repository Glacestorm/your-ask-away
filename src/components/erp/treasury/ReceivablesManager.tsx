import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowDownCircle, 
  Search, 
  Plus, 
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Receivable {
  id: string;
  due_date: string;
  amount: number;
  remaining_amount: number;
  status: string;
  currency_code: string;
  customer_id: string;
  created_at: string;
}

interface ReceivablesManagerProps {
  companyId: string;
}

export function ReceivablesManager({ companyId }: ReceivablesManagerProps) {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReceivables();
  }, [companyId]);

  const fetchReceivables = async () => {
    try {
      const { data, error } = await supabase
        .from('erp_receivables')
        .select('*')
        .eq('company_id', companyId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReceivables(data || []);
    } catch (err) {
      console.error('[ReceivablesManager] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const isOverdue = due < today && status === 'pending';

    if (status === 'collected') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Cobrado</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Vencido</Badge>;
    }
    if (status === 'partial') {
      return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Parcial</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
  };

  const totalPending = receivables
    .filter(r => r.status === 'pending' || r.status === 'partial')
    .reduce((sum, r) => sum + (r.remaining_amount || 0), 0);

  const overdueCount = receivables.filter(r => {
    const due = new Date(r.due_date);
    return due < new Date() && r.status === 'pending';
  }).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total pendiente</p>
          <p className="text-2xl font-bold text-green-600">
            € {totalPending.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Vencimientos</p>
          <p className="text-2xl font-bold">{receivables.length}</p>
        </Card>
        <Card className={cn("p-4", overdueCount > 0 && "border-yellow-500/30 bg-yellow-500/5")}>
          <p className="text-xs text-muted-foreground">Vencidos</p>
          <p className={cn("text-2xl font-bold", overdueCount > 0 && "text-yellow-600")}>
            {overdueCount}
          </p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cobros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cobro
        </Button>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : receivables.length === 0 ? (
            <div className="p-8 text-center">
              <ArrowDownCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No hay cobros pendientes</p>
            </div>
          ) : (
            <div className="divide-y">
              {receivables.map((receivable) => (
                <div key={receivable.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Cliente #{receivable.customer_id?.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Vence: {format(new Date(receivable.due_date), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {receivable.currency_code} {receivable.remaining_amount?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                      {getStatusBadge(receivable.status, receivable.due_date)}
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

export default ReceivablesManager;
