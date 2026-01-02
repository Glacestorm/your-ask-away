import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AgingBucket {
  label: string;
  count: number;
  amount: number;
  color: string;
}

interface AgingReportProps {
  companyId: string;
}

export function AgingReport({ companyId }: AgingReportProps) {
  const [receivablesAging, setReceivablesAging] = useState<AgingBucket[]>([]);
  const [payablesAging, setPayablesAging] = useState<AgingBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('receivables');

  useEffect(() => {
    calculateAging();
  }, [companyId]);

  const calculateAging = async () => {
    setLoading(true);
    try {
      const today = new Date();

      // Fetch receivables
      const { data: receivables } = await supabase
        .from('erp_receivables')
        .select('due_date, remaining_amount')
        .eq('company_id', companyId)
        .in('status', ['pending', 'partial']);

      // Fetch payables
      const { data: payables } = await supabase
        .from('erp_payables')
        .select('due_date, remaining_amount')
        .eq('company_id', companyId)
        .in('status', ['pending', 'partial']);

      const bucketItems = (items: any[] | null) => {
        const buckets = {
          current: { count: 0, amount: 0 },
          '1-30': { count: 0, amount: 0 },
          '31-60': { count: 0, amount: 0 },
          '61-90': { count: 0, amount: 0 },
          '>90': { count: 0, amount: 0 },
        };

        items?.forEach(item => {
          const dueDate = new Date(item.due_date);
          const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const amount = item.remaining_amount || 0;

          if (diffDays <= 0) {
            buckets.current.count++;
            buckets.current.amount += amount;
          } else if (diffDays <= 30) {
            buckets['1-30'].count++;
            buckets['1-30'].amount += amount;
          } else if (diffDays <= 60) {
            buckets['31-60'].count++;
            buckets['31-60'].amount += amount;
          } else if (diffDays <= 90) {
            buckets['61-90'].count++;
            buckets['61-90'].amount += amount;
          } else {
            buckets['>90'].count++;
            buckets['>90'].amount += amount;
          }
        });

        return [
          { label: 'Al corriente', ...buckets.current, color: 'bg-green-500' },
          { label: '1-30 días', ...buckets['1-30'], color: 'bg-yellow-500' },
          { label: '31-60 días', ...buckets['31-60'], color: 'bg-orange-500' },
          { label: '61-90 días', ...buckets['61-90'], color: 'bg-red-500' },
          { label: '> 90 días', ...buckets['>90'], color: 'bg-destructive' },
        ];
      };

      setReceivablesAging(bucketItems(receivables));
      setPayablesAging(bucketItems(payables));
    } catch (err) {
      console.error('[AgingReport] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderAgingTable = (aging: AgingBucket[], type: 'receivables' | 'payables') => {
    const total = aging.reduce((sum, b) => sum + b.amount, 0);
    const overdueTotal = aging.slice(1).reduce((sum, b) => sum + b.amount, 0);

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total pendiente</p>
            <p className={cn(
              "text-2xl font-bold",
              type === 'receivables' ? "text-green-600" : "text-red-600"
            )}>
              € {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </p>
          </Card>
          <Card className={cn("p-4", overdueTotal > 0 && "bg-destructive/5 border-destructive/20")}>
            <p className="text-xs text-muted-foreground">Total vencido</p>
            <p className={cn("text-2xl font-bold", overdueTotal > 0 && "text-destructive")}>
              € {overdueTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        {/* Aging Bars */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {aging.map((bucket, idx) => {
                const percentage = total > 0 ? (bucket.amount / total) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", bucket.color)} />
                        <span>{bucket.label}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {bucket.count}
                        </Badge>
                      </div>
                      <span className="font-medium">
                        € {bucket.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all", bucket.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Informe de Antigüedad
        </h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="receivables" className="gap-1.5">
            <ArrowDownCircle className="h-4 w-4" />
            Cobros
          </TabsTrigger>
          <TabsTrigger value="payables" className="gap-1.5">
            <ArrowUpCircle className="h-4 w-4" />
            Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="mt-4">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Calculando...</div>
          ) : (
            renderAgingTable(receivablesAging, 'receivables')
          )}
        </TabsContent>

        <TabsContent value="payables" className="mt-4">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Calculando...</div>
          ) : (
            renderAgingTable(payablesAging, 'payables')
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AgingReport;
