/**
 * Customer Journey Heatmap
 * Visualización de calor del journey del cliente identificando puntos de fricción
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Map, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  ArrowRight,
  Users,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JourneyStage {
  id: string;
  name: string;
  description: string;
  health: number;
  dropoff: number;
  avgTime: string;
  touchpoints: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface JourneyTransition {
  from: string;
  to: string;
  conversionRate: number;
  avgDays: number;
}

const mockJourneyStages: JourneyStage[] = [
  { id: 'awareness', name: 'Awareness', description: 'Descubrimiento inicial', health: 85, dropoff: 5, avgTime: '3 días', touchpoints: 2, sentiment: 'positive' },
  { id: 'consideration', name: 'Consideration', description: 'Evaluación de solución', health: 72, dropoff: 15, avgTime: '7 días', touchpoints: 5, sentiment: 'neutral' },
  { id: 'onboarding', name: 'Onboarding', description: 'Implementación inicial', health: 58, dropoff: 25, avgTime: '14 días', touchpoints: 12, sentiment: 'negative' },
  { id: 'adoption', name: 'Adoption', description: 'Uso regular del producto', health: 68, dropoff: 12, avgTime: '30 días', touchpoints: 8, sentiment: 'neutral' },
  { id: 'value', name: 'Value Realization', description: 'Logro de objetivos', health: 75, dropoff: 8, avgTime: '45 días', touchpoints: 4, sentiment: 'positive' },
  { id: 'expansion', name: 'Expansion', description: 'Crecimiento de cuenta', health: 82, dropoff: 3, avgTime: '90 días', touchpoints: 3, sentiment: 'positive' },
  { id: 'advocacy', name: 'Advocacy', description: 'Promoción activa', health: 92, dropoff: 2, avgTime: '120 días', touchpoints: 2, sentiment: 'positive' },
];

const mockTransitions: JourneyTransition[] = [
  { from: 'awareness', to: 'consideration', conversionRate: 75, avgDays: 5 },
  { from: 'consideration', to: 'onboarding', conversionRate: 60, avgDays: 10 },
  { from: 'onboarding', to: 'adoption', conversionRate: 72, avgDays: 21 },
  { from: 'adoption', to: 'value', conversionRate: 85, avgDays: 35 },
  { from: 'value', to: 'expansion', conversionRate: 45, avgDays: 60 },
  { from: 'expansion', to: 'advocacy', conversionRate: 30, avgDays: 90 },
];

const getHealthColor = (health: number): string => {
  if (health >= 80) return 'bg-emerald-500/80';
  if (health >= 60) return 'bg-amber-500/80';
  return 'bg-red-500/80';
};

const getHealthBgColor = (health: number): string => {
  if (health >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
  if (health >= 60) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-red-500/10 border-red-500/30';
};

export function CustomerJourneyHeatmap() {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const criticalStages = useMemo(() => 
    mockJourneyStages.filter(s => s.health < 65).length, 
    []
  );

  const avgHealth = useMemo(() => 
    Math.round(mockJourneyStages.reduce((sum, s) => sum + s.health, 0) / mockJourneyStages.length),
    []
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Map className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Customer Journey Heatmap</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualiza la salud y fricción en cada etapa del journey
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="mid-market">Mid-Market</SelectItem>
                <SelectItem value="smb">SMB</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className={cn(
              criticalStages > 0 ? "border-red-500/50 text-red-600" : "border-emerald-500/50 text-emerald-600"
            )}>
              {criticalStages > 0 ? (
                <><AlertTriangle className="h-3 w-3 mr-1" />{criticalStages} críticos</>
              ) : (
                <><CheckCircle className="h-3 w-3 mr-1" />Todo saludable</>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Health Promedio</p>
            <p className="text-2xl font-bold">{avgHealth}%</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Etapas</p>
            <p className="text-2xl font-bold">{mockJourneyStages.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Mayor Dropoff</p>
            <p className="text-2xl font-bold text-red-500">
              {Math.max(...mockJourneyStages.map(s => s.dropoff))}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Tiempo Total</p>
            <p className="text-2xl font-bold">~120d</p>
          </div>
        </div>

        {/* Journey Flow */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 -translate-y-1/2 z-0" />
          
          {/* Stages */}
          <div className="relative z-10 flex flex-wrap lg:flex-nowrap gap-2 lg:gap-0 justify-between">
            {mockJourneyStages.map((stage, index) => (
              <TooltipProvider key={stage.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "relative flex-1 min-w-[120px] max-w-[160px] cursor-pointer transition-all duration-200",
                        selectedStage === stage.id ? "scale-105" : "hover:scale-102"
                      )}
                      onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                    >
                      {/* Stage Card */}
                      <div className={cn(
                        "rounded-xl border-2 p-4 transition-all",
                        getHealthBgColor(stage.health),
                        selectedStage === stage.id && "ring-2 ring-primary"
                      )}>
                        {/* Health Bar */}
                        <div className="h-2 rounded-full bg-muted mb-3 overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all", getHealthColor(stage.health))}
                            style={{ width: `${stage.health}%` }}
                          />
                        </div>
                        
                        {/* Stage Info */}
                        <h4 className="font-medium text-sm mb-1">{stage.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{stage.description}</p>
                        
                        {/* Metrics */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Health</span>
                            <span className="font-medium">{stage.health}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Dropoff</span>
                            <span className={cn("font-medium", stage.dropoff > 15 && "text-red-500")}>
                              {stage.dropoff}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Tiempo</span>
                            <span className="font-medium">{stage.avgTime}</span>
                          </div>
                        </div>

                        {/* Sentiment Indicator */}
                        <div className="mt-3 flex justify-center">
                          {stage.sentiment === 'positive' && (
                            <Badge variant="secondary" className="text-emerald-600 bg-emerald-500/10 text-[10px]">
                              <TrendingUp className="h-2.5 w-2.5 mr-1" />Positivo
                            </Badge>
                          )}
                          {stage.sentiment === 'neutral' && (
                            <Badge variant="secondary" className="text-amber-600 bg-amber-500/10 text-[10px]">
                              <ArrowRight className="h-2.5 w-2.5 mr-1" />Neutral
                            </Badge>
                          )}
                          {stage.sentiment === 'negative' && (
                            <Badge variant="secondary" className="text-red-600 bg-red-500/10 text-[10px]">
                              <AlertTriangle className="h-2.5 w-2.5 mr-1" />Atención
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Transition Arrow */}
                      {index < mockJourneyStages.length - 1 && (
                        <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20">
                          <div className="w-8 h-8 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-medium">{stage.name}</p>
                      <p className="text-xs text-muted-foreground">{stage.description}</p>
                      <div className="pt-2 border-t space-y-1">
                        <p className="text-xs"><Users className="h-3 w-3 inline mr-1" />{stage.touchpoints} touchpoints</p>
                        <p className="text-xs">Tiempo promedio: {stage.avgTime}</p>
                        {stage.dropoff > 15 && (
                          <p className="text-xs text-red-500">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            Alto dropoff - requiere atención
                          </p>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* Selected Stage Details */}
        {selectedStage && (
          <div className="mt-6 p-4 rounded-xl bg-muted/30 border animate-in fade-in slide-in-from-bottom-2">
            {(() => {
              const stage = mockJourneyStages.find(s => s.id === selectedStage);
              const transition = mockTransitions.find(t => t.from === selectedStage);
              if (!stage) return null;
              
              return (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Map className="h-4 w-4 text-primary" />
                      {stage.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Health Score:</strong> {stage.health}%</p>
                    <p className="text-sm"><strong>Tasa de abandono:</strong> {stage.dropoff}%</p>
                    <p className="text-sm"><strong>Touchpoints:</strong> {stage.touchpoints}</p>
                  </div>
                  {transition && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Transición a siguiente etapa:</p>
                      <p className="text-sm"><strong>Conversión:</strong> {transition.conversionRate}%</p>
                      <p className="text-sm"><strong>Días promedio:</strong> {transition.avgDays}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
          <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Áreas de Mejora Prioritarias
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
              <span><strong>Onboarding:</strong> 25% dropoff - Simplificar pasos iniciales y añadir guías interactivas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
              <span><strong>Consideration:</strong> 15% dropoff - Mejorar demos y casos de uso personalizados</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
              <span><strong>Adoption → Value:</strong> 45 días promedio - Acelerar con quick wins tempranos</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default CustomerJourneyHeatmap;
