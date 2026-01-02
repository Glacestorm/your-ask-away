import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ForecastData {
  date: string;
  inflows: number;
  outflows: number;
  balance: number;
  cumulative: number;
}

interface CashFlowForecastProps {
  companyId: string;
}

export function CashFlowForecast({ companyId }: CashFlowForecastProps) {
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    generateForecast();
  }, [companyId, period]);

  const generateForecast = async () => {
    setLoading(true);
    try {
      // Get receivables
      const { data: receivables } = await supabase
        .from('erp_receivables')
        .select('due_date, remaining_amount')
        .eq('company_id', companyId)
        .in('status', ['pending', 'partial']);

      // Get payables
      const { data: payables } = await supabase
        .from('erp_payables')
        .select('due_date, remaining_amount')
        .eq('company_id', companyId)
        .in('status', ['pending', 'partial']);

      // Generate daily forecast
      const days = period === 'week' ? 7 : 30;
      const forecastData: ForecastData[] = [];
      let cumulative = 0;

      for (let i = 0; i < days; i++) {
        const date = addDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');

        const dayInflows = receivables
          ?.filter(r => r.due_date === dateStr)
          .reduce((sum, r) => sum + (r.remaining_amount || 0), 0) || 0;

        const dayOutflows = payables
          ?.filter(p => p.due_date === dateStr)
          .reduce((sum, p) => sum + (p.remaining_amount || 0), 0) || 0;

        const balance = dayInflows - dayOutflows;
        cumulative += balance;

        forecastData.push({
          date: dateStr,
          inflows: dayInflows,
          outflows: dayOutflows,
          balance,
          cumulative
        });
      }

      setForecast(forecastData);
    } catch (err) {
      console.error('[CashFlowForecast] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalInflows = forecast.reduce((sum, f) => sum + f.inflows, 0);
  const totalOutflows = forecast.reduce((sum, f) => sum + f.outflows, 0);
  const netFlow = totalInflows - totalOutflows;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-green-500/5 border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs text-muted-foreground">Entradas previstas</span>
          </div>
          <p className="text-xl font-bold text-green-600">
            € {totalInflows.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4 bg-red-500/5 border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-xs text-muted-foreground">Salidas previstas</span>
          </div>
          <p className="text-xl font-bold text-red-600">
            € {totalOutflows.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className={cn(
          "p-4",
          netFlow >= 0 ? "bg-blue-500/5 border-blue-500/20" : "bg-yellow-500/5 border-yellow-500/20"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowRight className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">Flujo neto</span>
          </div>
          <p className={cn(
            "text-xl font-bold",
            netFlow >= 0 ? "text-blue-600" : "text-yellow-600"
          )}>
            € {netFlow.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {/* Period Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant={period === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('week')}
          >
            7 días
          </Button>
          <Button 
            variant={period === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setPeriod('month')}
          >
            30 días
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={generateForecast} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Forecast Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Previsión de Tesorería
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Calculando previsión...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Fecha</th>
                    <th className="text-right p-3 font-medium text-green-600">Cobros</th>
                    <th className="text-right p-3 font-medium text-red-600">Pagos</th>
                    <th className="text-right p-3 font-medium">Saldo día</th>
                    <th className="text-right p-3 font-medium">Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {forecast.slice(0, period === 'week' ? 7 : 14).map((day) => (
                    <tr key={day.date} className="hover:bg-muted/30">
                      <td className="p-3">
                        {format(new Date(day.date), 'EEE dd MMM', { locale: es })}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        {day.inflows > 0 ? `€ ${day.inflows.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="p-3 text-right text-red-600">
                        {day.outflows > 0 ? `€ ${day.outflows.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className={cn(
                        "p-3 text-right font-medium",
                        day.balance > 0 && "text-green-600",
                        day.balance < 0 && "text-red-600"
                      )}>
                        € {day.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={cn(
                        "p-3 text-right font-bold",
                        day.cumulative >= 0 && "text-blue-600",
                        day.cumulative < 0 && "text-destructive"
                      )}>
                        € {day.cumulative.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CashFlowForecast;
