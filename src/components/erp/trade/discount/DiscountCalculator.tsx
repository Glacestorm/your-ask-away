/**
 * Calculadora de Descuento Comercial
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingDown, Percent, Euro } from 'lucide-react';
import { useERPDiscountOperations } from '@/hooks/erp/useERPDiscountOperations';

export function DiscountCalculator() {
  const [nominal, setNominal] = useState<number>(10000);
  const [days, setDays] = useState<number>(90);
  const [interestRate, setInterestRate] = useState<number>(5);
  const [commissionRate, setCommissionRate] = useState<number>(0.25);
  const [expenses, setExpenses] = useState<number>(30);

  const { calculateDiscount } = useERPDiscountOperations();

  const result = calculateDiscount({
    nominal,
    days,
    interestRate,
    commissionRate,
    expenses
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nominal" className="flex items-center gap-1">
            <Euro className="h-3 w-3" />
            Nominal
          </Label>
          <Input
            id="nominal"
            type="number"
            value={nominal}
            onChange={(e) => setNominal(Number(e.target.value))}
            min={0}
            step={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="days">Días hasta vencimiento</Label>
          <Input
            id="days"
            type="number"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            min={1}
            max={365}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interestRate" className="flex items-center gap-1">
            <Percent className="h-3 w-3" />
            Tipo interés anual
          </Label>
          <Input
            id="interestRate"
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            min={0}
            max={50}
            step={0.1}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="commissionRate" className="flex items-center gap-1">
            <Percent className="h-3 w-3" />
            Comisión
          </Label>
          <Input
            id="commissionRate"
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
            min={0}
            max={10}
            step={0.05}
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="expenses">Gastos fijos (€)</Label>
          <Input
            id="expenses"
            type="number"
            value={expenses}
            onChange={(e) => setExpenses(Number(e.target.value))}
            min={0}
            step={5}
          />
        </div>
      </div>

      <Separator />

      {/* Results */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Nominal:</span>
            <span className="font-mono">{formatCurrency(result.nominal)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Intereses ({result.interestRate}% x {result.days} días):
            </span>
            <span className="font-mono text-destructive">
              -{formatCurrency(result.interestAmount)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Comisión ({result.commissionRate}%):
            </span>
            <span className="font-mono text-destructive">
              -{formatCurrency(result.commissionAmount)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gastos:</span>
            <span className="font-mono text-destructive">
              -{formatCurrency(result.expenses)}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Total deducciones:</span>
            <span className="font-mono text-destructive">
              -{formatCurrency(result.totalDeductions)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="font-medium flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-green-600" />
              Líquido a percibir:
            </span>
            <span className="text-xl font-bold text-green-600 font-mono">
              {formatCurrency(result.netAmount)}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">TAE efectivo:</span>
            <span className="font-mono font-medium text-primary">
              {result.effectiveRate.toFixed(2)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Formula info */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        <p className="font-medium mb-1">Fórmulas aplicadas:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Intereses = Nominal × Tipo × Días / 360</li>
          <li>Comisión = Nominal × % Comisión</li>
          <li>TAE = (Deducciones / Nominal) × (360 / Días) × 100</li>
        </ul>
      </div>
    </div>
  );
}

export default DiscountCalculator;
