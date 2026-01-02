/**
 * ERPEBITDACard - Análisis EBIT/EBITDA visual
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, TrendingUp, TrendingDown, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, LineChart, Line, ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend
} from 'recharts';

export interface EBITEBITDAData {
  year: number;
  ventas: number;
  margenBruto: number;
  ebit: number;
  ebitda: number;
  margenBrutoPercent: number;
  margenEbit: number;
  margenEbitda: number;
  amortizaciones: number;
  gastosFinancieros: number;
  resultadoOrdinario: number;
}

interface ERPEBITDACardProps {
  data: EBITEBITDAData[];
  formatCurrency: (value: number) => string;
  formatPercent: (value: number) => string;
  className?: string;
}

export function ERPEBITDACard({ 
  data, 
  formatCurrency,
  formatPercent,
  className 
}: ERPEBITDACardProps) {
  const current = data[0];
  const previous = data[1];
  
  if (!current) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Sin datos EBIT/EBITDA</p>
        </CardContent>
      </Card>
    );
  }

  const getTrend = (curr: number, prev?: number) => {
    if (!prev || prev === 0) return null;
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  // Datos para gráfico de cascada
  const waterfallData = [
    { name: 'Ventas', value: current.ventas, fill: 'hsl(var(--chart-1))' },
    { name: 'Margen Bruto', value: current.margenBruto, fill: 'hsl(var(--chart-2))' },
    { name: 'EBITDA', value: current.ebitda, fill: 'hsl(var(--primary))' },
    { name: 'EBIT', value: current.ebit, fill: 'hsl(var(--chart-4))' },
    { name: 'Rtdo. Ordinario', value: current.resultadoOrdinario, fill: 'hsl(var(--chart-5))' },
  ];

  // Datos para evolución
  const evolutionData = [...data].reverse().slice(-5).map(d => ({
    year: d.year,
    EBIT: d.ebit,
    EBITDA: d.ebitda,
    'Margen EBITDA': d.margenEbitda,
  }));

  return (
    <div className={cn("space-y-4", className)}>
      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* EBITDA */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              EBITDA
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(current.ebitda)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {formatPercent(current.margenEbitda)} margen
              </Badge>
              {previous && (
                <span className={cn(
                  "text-xs flex items-center gap-0.5",
                  current.ebitda > previous.ebitda ? "text-emerald-600" : "text-red-600"
                )}>
                  {current.ebitda > previous.ebitda ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {getTrend(current.ebitda, previous.ebitda)?.toFixed(1)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* EBIT */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              EBIT
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Beneficio antes de intereses e impuestos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className={cn(
              "text-2xl font-bold",
              current.ebit >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {formatCurrency(current.ebit)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Margen: {formatPercent(current.margenEbit)}
            </div>
          </CardContent>
        </Card>

        {/* Margen Bruto */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Margen Bruto</div>
            <div className="text-2xl font-bold">
              {formatCurrency(current.margenBruto)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatPercent(current.margenBrutoPercent)} s/ventas
            </div>
          </CardContent>
        </Card>

        {/* Amortizaciones */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Amortizaciones</div>
            <div className="text-2xl font-bold text-muted-foreground">
              {formatCurrency(current.amortizaciones)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              EBITDA - EBIT
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cascada de márgenes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Cascada de Resultados {current.year}
              <Badge variant="outline" className="text-xs">De Ventas a Resultado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Visualización de cascada simplificada */}
            <div className="space-y-3 py-4">
              {waterfallData.map((item, idx) => {
                const percentage = current.ventas > 0 ? (item.value / current.ventas) * 100 : 0;
                const width = Math.min(100, Math.abs(percentage));
                
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        {idx > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatCurrency(item.value)}</span>
                        <Badge variant="outline" className="text-xs w-16 justify-center">
                          {percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${width}%`,
                          backgroundColor: item.fill
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Evolución EBIT/EBITDA */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolución EBIT / EBITDA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis 
                    yAxisId="left"
                    className="text-xs" 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    className="text-xs" 
                    tickFormatter={(v) => `${v}%`} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="EBIT" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="EBITDA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="Margen EBITDA" 
                    stroke="hsl(var(--chart-4))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-4))' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Márgenes comparativos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Evolución de Márgenes Operativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(v: number) => [`${v.toFixed(2)}%`]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Margen EBITDA" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ERPEBITDACard;
