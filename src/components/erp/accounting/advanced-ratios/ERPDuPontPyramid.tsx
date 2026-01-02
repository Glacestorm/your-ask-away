/**
 * ERPDuPontPyramid - Pirámide DuPont visual interactiva
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PieChart, TrendingUp, TrendingDown, ArrowRight, HelpCircle, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend, Cell
} from 'recharts';

export interface DuPontData {
  year: number;
  ventas: number;
  activo: number;
  activoCorriente: number;
  activoNoCorriente: number;
  bait: number;
  rotacionActivo: number;
  baitSobreVentas: number;
  roa: number;
  apalancamiento: number;
  roe: number;
}

interface ERPDuPontPyramidProps {
  data: DuPontData[];
  formatCurrency: (value: number) => string;
  formatPercent: (value: number) => string;
  formatNumber: (value: number) => string;
  className?: string;
}

export function ERPDuPontPyramid({ 
  data, 
  formatCurrency, 
  formatPercent, 
  formatNumber,
  className 
}: ERPDuPontPyramidProps) {
  const [selectedYear, setSelectedYear] = useState(0);
  const current = data[selectedYear];
  const previous = data[selectedYear + 1];
  
  if (!current) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <PieChart className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Sin datos DuPont</p>
        </CardContent>
      </Card>
    );
  }

  const getTrend = (currentVal: number, prevVal?: number) => {
    if (!prevVal || prevVal === 0) return null;
    const diff = ((currentVal - prevVal) / Math.abs(prevVal)) * 100;
    return diff;
  };

  const TrendIndicator = ({ value }: { value: number | null }) => {
    if (value === null) return null;
    const isPositive = value > 0;
    return (
      <span className={cn(
        "inline-flex items-center text-xs ml-1",
        isPositive ? "text-emerald-600" : value < 0 ? "text-red-600" : "text-muted-foreground"
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : value < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  // Datos para gráfico comparativo
  const chartData = [...data].reverse().slice(-5).map(d => ({
    year: d.year,
    ROE: d.roe * 100,
    ROA: d.roa * 100,
    Margen: d.baitSobreVentas * 100
  }));

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selector de año */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Año:</span>
        {data.slice(0, 4).map((d, idx) => (
          <button
            key={d.year}
            onClick={() => setSelectedYear(idx)}
            className={cn(
              "px-3 py-1 rounded-md text-sm transition-colors",
              selectedYear === idx 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {d.year}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pirámide Visual */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Pirámide DuPont {current.year}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>La pirámide DuPont descompone el ROE en sus componentes: 
                    margen sobre ventas, rotación de activos y apalancamiento financiero.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-4">
              {/* Nivel 1: ROE */}
              <div className="flex justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg cursor-help transform hover:scale-105 transition-transform min-w-[160px]">
                        <div className="text-xs opacity-80 mb-1">Rentabilidad Financiera</div>
                        <div className="text-3xl font-bold">
                          {formatPercent(current.roe * 100)}
                        </div>
                        <div className="text-xs font-medium mt-1">ROE</div>
                        <TrendIndicator value={getTrend(current.roe, previous?.roe)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>ROE = Beneficio Neto / Patrimonio Neto</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Conector */}
              <div className="flex justify-center">
                <div className="h-8 w-0.5 bg-border" />
              </div>
              
              {/* Nivel 2: ROA x Apalancamiento */}
              <div className="grid grid-cols-2 gap-4 px-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 cursor-help hover:bg-blue-500/20 transition-colors">
                        <div className="text-xs text-blue-600/80 mb-1">Rent. Económica</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPercent(current.roa * 100)}
                        </div>
                        <div className="text-xs font-medium text-blue-600/80">ROA</div>
                        <TrendIndicator value={getTrend(current.roa, previous?.roa)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>ROA = BAIT / Activo Total</p>
                      <p className="text-xs text-muted-foreground mt-1">Activo: {formatCurrency(current.activo)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 cursor-help hover:bg-purple-500/20 transition-colors">
                        <div className="text-xs text-purple-600/80 mb-1">Multiplicador</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {formatNumber(current.apalancamiento)}x
                        </div>
                        <div className="text-xs font-medium text-purple-600/80">Apalancamiento</div>
                        <TrendIndicator value={getTrend(current.apalancamiento, previous?.apalancamiento)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Apalancamiento = Activo Total / Patrimonio Neto</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Conectores */}
              <div className="flex justify-center gap-[40%]">
                <div className="h-6 w-0.5 bg-border" />
                <div className="h-6 w-0.5 bg-border opacity-0" />
              </div>
              
              {/* Nivel 3: Margen x Rotación */}
              <div className="grid grid-cols-2 gap-4 px-8">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 cursor-help hover:bg-emerald-500/20 transition-colors">
                        <div className="text-xs text-emerald-600/80 mb-1">Margen</div>
                        <div className="text-xl font-bold text-emerald-600">
                          {formatPercent(current.baitSobreVentas * 100)}
                        </div>
                        <div className="text-xs text-emerald-600/80">BAIT/Ventas</div>
                        <TrendIndicator value={getTrend(current.baitSobreVentas, previous?.baitSobreVentas)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Margen = BAIT / Ventas Netas</p>
                      <p className="text-xs text-muted-foreground mt-1">BAIT: {formatCurrency(current.bait)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 cursor-help hover:bg-amber-500/20 transition-colors">
                        <div className="text-xs text-amber-600/80 mb-1">Rotación</div>
                        <div className="text-xl font-bold text-amber-600">
                          {formatNumber(current.rotacionActivo)}
                        </div>
                        <div className="text-xs text-amber-600/80">Ventas/Activo</div>
                        <TrendIndicator value={getTrend(current.rotacionActivo, previous?.rotacionActivo)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Rotación = Ventas / Activo Total</p>
                      <p className="text-xs text-muted-foreground mt-1">Ventas: {formatCurrency(current.ventas)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Fórmula visual */}
              <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground border-t mt-4">
                <Badge variant="outline" className="font-mono">
                  {formatPercent(current.baitSobreVentas * 100)}
                </Badge>
                <span>×</span>
                <Badge variant="outline" className="font-mono">
                  {formatNumber(current.rotacionActivo)}
                </Badge>
                <span>=</span>
                <Badge variant="secondary" className="font-mono">
                  ROA {formatPercent(current.roa * 100)}
                </Badge>
                <span>×</span>
                <Badge variant="outline" className="font-mono">
                  {formatNumber(current.apalancamiento)}x
                </Badge>
                <span>=</span>
                <Badge className="font-mono bg-primary">
                  ROE {formatPercent(current.roe * 100)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Comparativo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolución ROE / ROA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis 
                    className="text-xs" 
                    tickFormatter={(v) => `${v}%`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`]}
                  />
                  <Legend />
                  <Bar dataKey="ROE" name="ROE" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ROA" name="ROA" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Margen" name="Margen s/Ventas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interpretación */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Margen de Beneficio
              </h4>
              <p className="text-xs text-muted-foreground">
                {current.baitSobreVentas > 0.1 
                  ? 'Margen superior al 10%, indica buena eficiencia operativa.'
                  : current.baitSobreVentas > 0.05
                  ? 'Margen moderado, hay espacio para optimización.'
                  : 'Margen bajo, revisar estructura de costes.'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Rotación de Activos
              </h4>
              <p className="text-xs text-muted-foreground">
                {current.rotacionActivo > 1.5 
                  ? 'Alta rotación, uso eficiente de activos.'
                  : current.rotacionActivo > 0.8
                  ? 'Rotación aceptable para el sector.'
                  : 'Rotación baja, activos infrautilizados.'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                Apalancamiento
              </h4>
              <p className="text-xs text-muted-foreground">
                {current.apalancamiento > 3 
                  ? 'Alto apalancamiento, mayor riesgo financiero.'
                  : current.apalancamiento > 1.5
                  ? 'Apalancamiento equilibrado.'
                  : 'Bajo apalancamiento, estructura conservadora.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ERPDuPontPyramid;
