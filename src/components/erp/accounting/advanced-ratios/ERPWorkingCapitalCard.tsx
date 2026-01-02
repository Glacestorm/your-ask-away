/**
 * ERPWorkingCapitalCard - Análisis de Capital Circulante visual
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wallet, TrendingUp, TrendingDown, HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend, Cell, ReferenceLine
} from 'recharts';

export interface WorkingCapitalData {
  year: number;
  totalCurrentAssets: number;
  inventory: number;
  tradeReceivables: number;
  cashEquivalents: number;
  totalCurrentLiabilities: number;
  shortTermDebts: number;
  tradePayables: number;
  workingCapital: number;
  nof: number;
  solvencyRatio: number;
  acidTestRatio: number;
  liquidityRatio: number;
  basicFinancingCoefficient: number;
}

interface ERPWorkingCapitalCardProps {
  data: WorkingCapitalData[];
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  className?: string;
}

const ratioRanges = {
  solvencyRatio: { min: 1.5, optimal: 2, max: 3, name: 'Solvencia' },
  acidTestRatio: { min: 0.8, optimal: 1, max: 1.5, name: 'Test Ácido' },
  liquidityRatio: { min: 0.2, optimal: 0.5, max: 1, name: 'Liquidez' },
};

export function ERPWorkingCapitalCard({ 
  data, 
  formatCurrency, 
  formatNumber,
  className 
}: ERPWorkingCapitalCardProps) {
  const current = data[0];
  const previous = data[1];
  
  if (!current) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Wallet className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Sin datos de Capital Circulante</p>
        </CardContent>
      </Card>
    );
  }

  const getRatioStatus = (value: number, range: typeof ratioRanges.solvencyRatio) => {
    if (value >= range.optimal) return 'good';
    if (value >= range.min) return 'warning';
    return 'bad';
  };

  // Datos para gráfico de composición
  const compositionData = [
    { name: 'Activo Corriente', value: current.totalCurrentAssets, fill: 'hsl(var(--chart-2))' },
    { name: 'Pasivo Corriente', value: current.totalCurrentLiabilities, fill: 'hsl(var(--destructive))' },
  ];

  // Datos para evolución
  const evolutionData = [...data].reverse().slice(-5).map(d => ({
    year: d.year,
    'Fondo Maniobra': d.workingCapital,
    'NOF': d.nof,
  }));

  return (
    <div className={cn("space-y-4", className)}>
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fondo de Maniobra */}
        <Card className={cn(
          "relative overflow-hidden",
          current.workingCapital >= 0 ? "border-emerald-500/30" : "border-red-500/30"
        )}>
          <div className={cn(
            "absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10",
            current.workingCapital >= 0 ? "bg-emerald-500" : "bg-red-500"
          )} />
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              Fondo de Maniobra
            </div>
            <div className={cn(
              "text-2xl font-bold",
              current.workingCapital >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {formatCurrency(current.workingCapital)}
            </div>
            {previous && (
              <div className="flex items-center gap-1 mt-1 text-xs">
                {current.workingCapital > previous.workingCapital ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className="text-muted-foreground">
                  vs {formatCurrency(previous.workingCapital)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NOF */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              NOF
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Necesidades Operativas de Fondos</p>
                    <p className="text-xs">= Existencias + Clientes - Proveedores</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(current.nof)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {current.workingCapital >= current.nof 
                ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> FM cubre NOF</span>
                : <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> FM insuficiente</span>
              }
            </div>
          </CardContent>
        </Card>

        {/* Activo Corriente */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Activo Corriente</div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(current.totalCurrentAssets)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <div>Efectivo: {formatCurrency(current.cashEquivalents)}</div>
              <div>Clientes: {formatCurrency(current.tradeReceivables)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Pasivo Corriente */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Pasivo Corriente</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(current.totalCurrentLiabilities)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <div>Deudas C/P: {formatCurrency(current.shortTermDebts)}</div>
              <div>Proveedores: {formatCurrency(current.tradePayables)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ratios de Liquidez */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ratios de Liquidez</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {Object.entries(ratioRanges).map(([key, range]) => {
                const value = current[key as keyof WorkingCapitalData] as number;
                const status = getRatioStatus(value, range);
                const percentage = Math.min(100, (value / range.max) * 100);
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{range.name}</span>
                        {status === 'good' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        {status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        {status === 'bad' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                      <Badge 
                        variant="outline"
                        className={cn(
                          status === 'good' && "border-emerald-500 text-emerald-600",
                          status === 'warning' && "border-amber-500 text-amber-600",
                          status === 'bad' && "border-red-500 text-red-600"
                        )}
                      >
                        {formatNumber(value)}
                      </Badge>
                    </div>
                    
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      {/* Zonas */}
                      <div 
                        className="absolute h-full bg-red-200" 
                        style={{ width: `${(range.min / range.max) * 100}%` }}
                      />
                      <div 
                        className="absolute h-full bg-amber-200" 
                        style={{ left: `${(range.min / range.max) * 100}%`, width: `${((range.optimal - range.min) / range.max) * 100}%` }}
                      />
                      <div 
                        className="absolute h-full bg-emerald-200" 
                        style={{ left: `${(range.optimal / range.max) * 100}%`, width: `${((range.max - range.optimal) / range.max) * 100}%` }}
                      />
                      {/* Valor actual */}
                      <div 
                        className={cn(
                          "absolute h-full rounded-full transition-all",
                          status === 'good' && "bg-emerald-500",
                          status === 'warning' && "bg-amber-500",
                          status === 'bad' && "bg-red-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Mín: {range.min}</span>
                      <span>Óptimo: {range.optimal}</span>
                      <span>Máx: {range.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Evolución FM vs NOF */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolución Fondo Maniobra vs NOF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolutionData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCurrency(value)]}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                  <Bar dataKey="Fondo Maniobra" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="NOF" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla histórica */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Histórico de Ratios de Liquidez</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ejercicio</TableHead>
                <TableHead className="text-right">Solvencia</TableHead>
                <TableHead className="text-right">Test Ácido</TableHead>
                <TableHead className="text-right">Liquidez</TableHead>
                <TableHead className="text-right">Coef. Financ.</TableHead>
                <TableHead className="text-right">FM</TableHead>
                <TableHead className="text-right">NOF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 5).map((d) => (
                <TableRow key={d.year}>
                  <TableCell className="font-medium">{d.year}</TableCell>
                  <TableCell className="text-right font-mono">
                    <Badge variant="outline" className={cn(
                      d.solvencyRatio >= 2 ? "border-emerald-500 text-emerald-600" :
                      d.solvencyRatio >= 1.5 ? "border-amber-500 text-amber-600" :
                      "border-red-500 text-red-600"
                    )}>
                      {formatNumber(d.solvencyRatio)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(d.acidTestRatio)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(d.liquidityRatio)}</TableCell>
                  <TableCell className="text-right font-mono">{formatNumber(d.basicFinancingCoefficient)}</TableCell>
                  <TableCell className={cn(
                    "text-right font-mono",
                    d.workingCapital >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {formatCurrency(d.workingCapital)}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(d.nof)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default ERPWorkingCapitalCard;
