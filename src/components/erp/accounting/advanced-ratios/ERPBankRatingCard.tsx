/**
 * ERPBankRatingCard - Rating Bancario visual con gauge
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BankRatingData {
  score: number;
  rating: string;
  riskLevel: 'bajo' | 'medio' | 'alto' | 'muy_alto';
  factors: Array<{
    name: string;
    value: number;
    weight: number;
    contribution: number;
  }>;
}

interface ERPBankRatingCardProps {
  data: BankRatingData;
  className?: string;
}

const ratingColors: Record<string, { bg: string; text: string; border: string }> = {
  'AAA': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/30' },
  'AA': { bg: 'bg-emerald-400/10', text: 'text-emerald-500', border: 'border-emerald-400/30' },
  'A': { bg: 'bg-lime-500/10', text: 'text-lime-600', border: 'border-lime-500/30' },
  'BBB': { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/30' },
  'BB': { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30' },
  'B': { bg: 'bg-orange-600/10', text: 'text-orange-700', border: 'border-orange-600/30' },
  'CCC': { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30' },
};

const ratingDescriptions: Record<string, string> = {
  'AAA': 'Máxima calidad crediticia. Capacidad extremadamente fuerte para cumplir compromisos.',
  'AA': 'Calidad crediticia muy alta. Capacidad muy fuerte para cumplir compromisos.',
  'A': 'Calidad crediticia alta. Capacidad fuerte para cumplir compromisos.',
  'BBB': 'Calidad crediticia adecuada. Capacidad satisfactoria para cumplir compromisos.',
  'BB': 'Calidad especulativa. Vulnerable a condiciones adversas.',
  'B': 'Alta especulación. Mayor vulnerabilidad a condiciones adversas.',
  'CCC': 'Riesgo sustancial. Dependiente de condiciones favorables.',
};

export function ERPBankRatingCard({ data, className }: ERPBankRatingCardProps) {
  const colors = ratingColors[data.rating] || ratingColors['BBB'];
  
  // Calcular posición en el arco del gauge
  const gaugeAngle = (data.score / 100) * 180;

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4", className)}>
      {/* Rating Principal */}
      <Card className="relative overflow-hidden">
        <div className={cn("absolute inset-0 opacity-30", colors.bg)} />
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Calificación Bancaria Estimada
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Estimación basada en ratios financieros. No sustituye a una calificación oficial de agencias de rating.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex flex-col items-center py-6">
            {/* Gauge Visual Mejorado */}
            <div className="relative w-56 h-28 mb-6">
              <svg viewBox="0 0 120 60" className="w-full h-full">
                {/* Gradiente */}
                <defs>
                  <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" />
                    <stop offset="30%" stopColor="hsl(var(--chart-4))" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="70%" stopColor="#a3e635" />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" />
                  </linearGradient>
                </defs>
                
                {/* Arco de fondo */}
                <path
                  d="M 10 55 A 50 50 0 0 1 110 55"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                
                {/* Arco coloreado */}
                <path
                  d="M 10 55 A 50 50 0 0 1 110 55"
                  fill="none"
                  stroke="url(#ratingGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(data.score / 100) * 157} 157`}
                />
                
                {/* Marcas de rating */}
                {[0, 30, 50, 70, 100].map((pos, i) => {
                  const angle = (pos / 100) * Math.PI;
                  const x = 60 - Math.cos(angle) * 40;
                  const y = 55 - Math.sin(angle) * 40;
                  return (
                    <circle key={i} cx={x} cy={y} r="2" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                  );
                })}
                
                {/* Indicador needle */}
                <g transform={`rotate(${gaugeAngle - 90}, 60, 55)`}>
                  <line x1="60" y1="55" x2="60" y2="15" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="60" cy="55" r="4" fill="hsl(var(--foreground))" />
                </g>
              </svg>
            </div>
            
            {/* Rating grande */}
            <div className={cn(
              "text-6xl font-black mb-3 tracking-wider",
              colors.text
            )}>
              {data.rating}
            </div>
            
            {/* Score */}
            <div className="flex items-center gap-3 mb-4">
              <Progress value={data.score} className="w-32 h-2" />
              <span className="text-lg font-semibold">{data.score.toFixed(0)}/100</span>
            </div>
            
            {/* Nivel de riesgo */}
            <Badge 
              variant={
                data.riskLevel === 'bajo' ? 'default' :
                data.riskLevel === 'medio' ? 'secondary' :
                'destructive'
              }
              className="text-sm px-4 py-1"
            >
              {data.riskLevel === 'bajo' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
              {data.riskLevel === 'medio' && <AlertTriangle className="h-3.5 w-3.5 mr-1" />}
              {(data.riskLevel === 'alto' || data.riskLevel === 'muy_alto') && <AlertTriangle className="h-3.5 w-3.5 mr-1" />}
              Riesgo {data.riskLevel.replace('_', ' ')}
            </Badge>
            
            {/* Descripción */}
            <p className="text-xs text-muted-foreground text-center mt-4 max-w-xs">
              {ratingDescriptions[data.rating]}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Factores de Calificación */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Factores de Calificación</span>
            <Badge variant="outline" className="text-xs">6 factores</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {data.factors.map((factor, idx) => {
              const maxContribution = factor.weight * 100;
              const percentage = (factor.contribution / maxContribution) * 100;
              const isStrong = percentage >= 70;
              const isWeak = percentage < 40;
              
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{factor.name}</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          isStrong && "border-emerald-500 text-emerald-600",
                          isWeak && "border-red-500 text-red-600"
                        )}
                      >
                        {factor.contribution.toFixed(1)} pts
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Peso: {(factor.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={percentage} 
                      className={cn(
                        "h-3",
                        isStrong && "[&>div]:bg-emerald-500",
                        isWeak && "[&>div]:bg-red-500"
                      )}
                    />
                    {/* Marcador de referencia óptima */}
                    <div 
                      className="absolute top-0 w-0.5 h-3 bg-foreground/50" 
                      style={{ left: '70%' }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Valor: {factor.value.toFixed(2)}</span>
                    <span>
                      {isStrong && '✓ Fortaleza'}
                      {isWeak && '⚠ Mejorable'}
                      {!isStrong && !isWeak && 'Aceptable'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Leyenda */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span>&gt; 70%: Fortaleza</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary" />
              <span>40-70%: Normal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>&lt; 40%: Mejorable</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ERPBankRatingCard;
