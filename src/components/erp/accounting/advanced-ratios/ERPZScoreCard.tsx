/**
 * ERPZScoreCard - Componente visual para Z-Score con gauge y detalles
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, TrendingUp, TrendingDown, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, ReferenceLine
} from 'recharts';

export interface ZScoreData {
  year: number;
  x1: number;
  x2: number;
  x3: number;
  x4: number;
  x5: number;
  zScore: number;
  zone: 'safe' | 'gray' | 'distress';
  interpretation: string;
}

interface ERPZScoreCardProps {
  data: ZScoreData[];
  sector?: string;
  className?: string;
}

const zScoreColors = {
  safe: 'hsl(var(--chart-2))',
  gray: 'hsl(var(--chart-4))',
  distress: 'hsl(var(--destructive))'
};

const componentDescriptions: Record<string, string> = {
  x1: 'Fondo de Maniobra / Activo Total - Mide la liquidez relativa',
  x2: 'Beneficios Retenidos / Activo Total - Mide la rentabilidad acumulada',
  x3: 'EBIT / Activo Total - Mide la productividad de los activos',
  x4: 'Patrimonio Neto / Pasivo Exigible - Mide la solvencia',
  x5: 'Ventas / Activo Total - Mide la rotación de activos'
};

export function ERPZScoreCard({ data, sector = 'general', className }: ERPZScoreCardProps) {
  const latestData = data[0];
  const previousData = data[1];
  
  if (!latestData) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Sin datos para Z-Score</p>
        </CardContent>
      </Card>
    );
  }

  const trend = previousData 
    ? latestData.zScore - previousData.zScore 
    : 0;

  const gaugeValue = Math.min(100, Math.max(0, (latestData.zScore / 4) * 100));
  
  // Datos para el gauge semicircular
  const gaugeSegments = [
    { name: 'Riesgo', value: 30, color: 'hsl(var(--destructive))' },
    { name: 'Gris', value: 20, color: 'hsl(var(--chart-4))' },
    { name: 'Seguro', value: 50, color: 'hsl(var(--chart-2))' }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gauge y Score Principal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Índice Z de Altman
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>El Z-Score de Altman predice la probabilidad de quiebra empresarial. 
                    Valores &gt; 2.99 indican zona segura, entre 1.81-2.99 zona gris, 
                    y &lt; 1.81 zona de riesgo.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4">
              {/* Gauge Visual */}
              <div className="relative w-48 h-24 mb-4">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  {/* Arco de fondo */}
                  <path
                    d="M 5 50 A 45 45 0 0 1 95 50"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Zona Riesgo */}
                  <path
                    d="M 5 50 A 45 45 0 0 1 32 12"
                    fill="none"
                    stroke="hsl(var(--destructive))"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Zona Gris */}
                  <path
                    d="M 32 12 A 45 45 0 0 1 68 12"
                    fill="none"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Zona Segura */}
                  <path
                    d="M 68 12 A 45 45 0 0 1 95 50"
                    fill="none"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Indicador */}
                  <circle
                    cx={5 + (gaugeValue * 0.9)}
                    cy={50 - Math.sin((gaugeValue / 100) * Math.PI) * 45}
                    r="4"
                    fill="hsl(var(--foreground))"
                    stroke="hsl(var(--background))"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              
              {/* Valor Principal */}
              <div 
                className="text-5xl font-bold mb-2"
                style={{ color: zScoreColors[latestData.zone] }}
              >
                {latestData.zScore.toFixed(2)}
              </div>
              
              {/* Trend */}
              <div className="flex items-center gap-2 mb-3">
                {trend !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    trend > 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {trend > 0 ? '+' : ''}{trend.toFixed(2)} vs año anterior
                  </div>
                )}
              </div>
              
              {/* Zona Badge */}
              <Badge 
                variant="outline" 
                className="text-sm px-4 py-1"
                style={{ 
                  borderColor: zScoreColors[latestData.zone],
                  color: zScoreColors[latestData.zone],
                  backgroundColor: `${zScoreColors[latestData.zone]}10`
                }}
              >
                {latestData.zone === 'safe' ? '✓ Zona Segura' : 
                 latestData.zone === 'gray' ? '⚠ Zona Gris' : '✗ Zona de Riesgo'}
              </Badge>
              
              {/* Interpretación */}
              <p className="text-xs text-muted-foreground text-center mt-3 max-w-xs">
                {latestData.interpretation}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Evolución Histórica */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Evolución Z-Score ({sector})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...data].reverse()}>
                  <defs>
                    <linearGradient id="zScoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis domain={[0, 5]} className="text-xs" />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value.toFixed(2), 'Z-Score']}
                  />
                  {/* Líneas de referencia de zonas */}
                  <ReferenceLine y={2.99} stroke="hsl(var(--chart-2))" strokeDasharray="5 5" label={{ value: 'Seguro', position: 'right', fontSize: 10 }} />
                  <ReferenceLine y={1.81} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Riesgo', position: 'right', fontSize: 10 }} />
                  <Area 
                    type="monotone" 
                    dataKey="zScore" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#zScoreGradient)"
                    strokeWidth={2}
                    name="Z-Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Componentes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            Desglose de Componentes
            <Badge variant="secondary" className="text-xs">Fórmula Altman</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Componente</TableHead>
                <TableHead>Descripción</TableHead>
                {data.slice(0, 4).map(z => (
                  <TableHead key={z.year} className="text-right w-[80px]">{z.year}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {['x1', 'x2', 'x3', 'x4', 'x5'].map((comp) => (
                <TableRow key={comp}>
                  <TableCell className="font-medium">
                    <span className="font-mono bg-muted px-1 rounded">{comp.toUpperCase()}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {componentDescriptions[comp]}
                  </TableCell>
                  {data.slice(0, 4).map(z => (
                    <TableCell key={z.year} className="text-right font-mono text-sm">
                      {(z[comp as keyof ZScoreData] as number).toFixed(3)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2 bg-muted/30">
                <TableCell colSpan={2}>Z-SCORE TOTAL</TableCell>
                {data.slice(0, 4).map(z => (
                  <TableCell 
                    key={z.year} 
                    className="text-right font-mono"
                    style={{ color: zScoreColors[z.zone] }}
                  >
                    {z.zScore.toFixed(2)}
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

export default ERPZScoreCard;
