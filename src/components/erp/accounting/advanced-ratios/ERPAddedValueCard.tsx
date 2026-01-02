/**
 * ERPAddedValueCard - Análisis del Valor Añadido
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Users, Building, Landmark, TrendingUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend
} from 'recharts';

export interface AddedValueData {
  year: number;
  vendasNetes: number;
  valorProduccio: number;
  valorAfegitBrut: number;
  valorAfegitNet: number;
  gastosPersonal: number;
  amortitzacions: number;
  resultadoNeto: number;
  impuestos: number;
}

interface ERPAddedValueCardProps {
  data: AddedValueData[];
  formatCurrency: (value: number) => string;
  formatPercent: (value: number) => string;
  className?: string;
}

const distributionColors = [
  'hsl(var(--chart-1))',  // Personal
  'hsl(var(--chart-2))',  // Amortizaciones
  'hsl(var(--chart-4))',  // Impuestos
  'hsl(var(--primary))',  // Resultado
];

export function ERPAddedValueCard({ 
  data, 
  formatCurrency,
  formatPercent,
  className 
}: ERPAddedValueCardProps) {
  const current = data[0];
  
  if (!current) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Sin datos de Valor Añadido</p>
        </CardContent>
      </Card>
    );
  }

  // Distribución del valor añadido
  const distributionData = [
    { name: 'Personal', value: Math.abs(current.gastosPersonal), icon: Users, color: distributionColors[0] },
    { name: 'Amortizaciones', value: Math.abs(current.amortitzacions), icon: Building, color: distributionColors[1] },
    { name: 'Impuestos', value: Math.abs(current.impuestos), icon: Landmark, color: distributionColors[2] },
    { name: 'Resultado', value: Math.abs(current.resultadoNeto), icon: TrendingUp, color: distributionColors[3] },
  ].filter(d => d.value > 0);

  const totalDistribution = distributionData.reduce((acc, d) => acc + d.value, 0);

  // Evolución
  const evolutionData = [...data].reverse().slice(-5).map(d => ({
    year: d.year,
    'VA Bruto': d.valorAfegitBrut,
    'VA Neto': d.valorAfegitNet,
  }));

  // Productividad por empleado (estimación simple)
  const productivityData = [...data].reverse().slice(-5).map(d => ({
    year: d.year,
    'VA por Euro Personal': d.gastosPersonal > 0 ? (d.valorAfegitNet / Math.abs(d.gastosPersonal)).toFixed(2) : 0,
  }));

  return (
    <div className={cn("space-y-4", className)}>
      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Valor Producción */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">Valor Producción</div>
            <div className="text-2xl font-bold">
              {formatCurrency(current.valorProduccio)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Ventas + Variaciones
            </div>
          </CardContent>
        </Card>

        {/* VA Bruto */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full" />
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              VA Bruto
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(current.valorAfegitBrut)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {current.valorProduccio > 0 
                ? formatPercent((current.valorAfegitBrut / current.valorProduccio) * 100) + ' s/prod'
                : 'N/A'}
            </div>
          </CardContent>
        </Card>

        {/* VA Neto */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">VA Neto</div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(current.valorAfegitNet)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              VA Bruto - Amortizaciones
            </div>
          </CardContent>
        </Card>

        {/* Ratio VA/Ventas */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              Ratio VA/Ventas
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mide qué porcentaje de las ventas se convierte en valor añadido</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-2xl font-bold">
              {current.vendasNetes > 0 
                ? formatPercent((current.valorAfegitNet / current.vendasNetes) * 100)
                : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Eficiencia en generación de valor
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribución del Valor Añadido */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Distribución del Valor Añadido {current.year}
              <Badge variant="outline" className="text-xs">Reparto</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {/* Gráfico Pie */}
              <div className="w-1/2 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [formatCurrency(value)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Leyenda detallada */}
              <div className="w-1/2 space-y-3">
                {distributionData.map((item, idx) => {
                  const Icon = item.icon;
                  const percentage = totalDistribution > 0 ? (item.value / totalDistribution) * 100 : 0;
                  
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: item.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.value)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evolución VA */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolución Valor Añadido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
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
                  <Bar dataKey="VA Bruto" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="VA Neto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla histórica */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Generación y Distribución del Valor Añadido</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                {data.slice(0, 4).map(d => (
                  <TableHead key={d.year} className="text-right">{d.year}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Ventas Netas</TableCell>
                {data.slice(0, 4).map(d => (
                  <TableCell key={d.year} className="text-right font-mono">
                    {formatCurrency(d.vendasNetes)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Valor Producción</TableCell>
                {data.slice(0, 4).map(d => (
                  <TableCell key={d.year} className="text-right font-mono">
                    {formatCurrency(d.valorProduccio)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-emerald-500/5">
                <TableCell className="font-medium text-emerald-600">VA Bruto</TableCell>
                {data.slice(0, 4).map(d => (
                  <TableCell key={d.year} className="text-right font-mono text-emerald-600">
                    {formatCurrency(d.valorAfegitBrut)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium pl-6">- Amortizaciones</TableCell>
                {data.slice(0, 4).map(d => (
                  <TableCell key={d.year} className="text-right font-mono text-muted-foreground">
                    ({formatCurrency(d.amortitzacions)})
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-primary/5">
                <TableCell className="font-medium text-primary">VA Neto</TableCell>
                {data.slice(0, 4).map(d => (
                  <TableCell key={d.year} className="text-right font-mono text-primary font-bold">
                    {formatCurrency(d.valorAfegitNet)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="border-t-2">
                <TableCell className="font-medium pl-6">→ Personal</TableCell>
                {data.slice(0, 4).map(d => (
                  <TableCell key={d.year} className="text-right font-mono">
                    {formatCurrency(d.gastosPersonal)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium pl-6">→ Impuestos</TableCell>
                {data.slice(0, 4).map(d => (
                  <TableCell key={d.year} className="text-right font-mono">
                    {formatCurrency(d.impuestos)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium pl-6">→ Resultado Neto</TableCell>
                {data.slice(0, 4).map(d => (
                  <TableCell key={d.year} className={cn(
                    "text-right font-mono",
                    d.resultadoNeto >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {formatCurrency(d.resultadoNeto)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default ERPAddedValueCard;
