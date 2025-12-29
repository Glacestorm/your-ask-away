/**
 * BudgetingPanel - Fase 13: Presupuestos y Planificación
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useObelixiaBudgeting } from '@/hooks/admin/obelixia-accounting/useObelixiaBudgeting';
import { cn } from '@/lib/utils';

export function BudgetingPanel() {
  const { isLoading, budgets, fetchBudgets } = useObelixiaBudgeting();

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalConsumed = budgets.reduce((sum, b) => sum + b.consumed, 0);
  const consumedPercent = totalBudgeted > 0 ? (totalConsumed / totalBudgeted) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Presupuestos y Planificación
          </h2>
          <p className="text-muted-foreground">Control presupuestario con IA</p>
        </div>
        <Button onClick={() => fetchBudgets()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">${(totalBudgeted / 1000000).toFixed(1)}M</div>
            <p className="text-sm text-muted-foreground">Presupuesto Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">${(totalConsumed / 1000000).toFixed(1)}M</div>
            <p className="text-sm text-muted-foreground">Consumido</p>
            <Progress value={consumedPercent} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{budgets.length}</div>
            <p className="text-sm text-muted-foreground">Presupuestos Activos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Presupuestos</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {budgets.map((budget) => (
                <div key={budget.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{budget.name}</p>
                      <p className="text-sm text-muted-foreground">{budget.type} • {budget.period}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={budget.status === 'active' ? 'default' : 'secondary'}>{budget.status}</Badge>
                      {budget.variancePercentage > 0 ? 
                        <TrendingUp className="h-4 w-4 text-green-500" /> : 
                        <TrendingDown className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                  <Progress value={(budget.consumed / budget.totalBudget) * 100} />
                  <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                    <span>${budget.consumed.toLocaleString()}</span>
                    <span>${budget.totalBudget.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default BudgetingPanel;
