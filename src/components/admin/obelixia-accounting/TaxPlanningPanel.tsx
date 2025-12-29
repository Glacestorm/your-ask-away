/**
 * TaxPlanningPanel - Fase 9: Intelligent Tax Planning & Optimization
 * Enterprise SaaS 2025-2026
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  Lightbulb,
  Target,
  PieChart,
  Maximize2,
  Minimize2,
  Clock,
  Zap,
  Shield
} from 'lucide-react';
import { useObelixiaTaxPlanning, TaxPlanningContext } from '@/hooks/admin/obelixia-accounting/useObelixiaTaxPlanning';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaxPlanningPanelProps {
  context?: TaxPlanningContext | null;
  className?: string;
}

export function TaxPlanningPanel({ context, className }: TaxPlanningPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const {
    isLoading,
    optimizations,
    calendar,
    deductions,
    summary,
    lastRefresh,
    refreshAll,
    updateOptimizationStatus,
    startAutoRefresh,
    stopAutoRefresh
  } = useObelixiaTaxPlanning();

  useEffect(() => {
    if (context) {
      startAutoRefresh(context, 180000);
    }
    return () => stopAutoRefresh();
  }, [context, startAutoRefresh, stopAutoRefresh]);

  const handleRefresh = useCallback(() => {
    refreshAll(context || undefined);
  }, [refreshAll, context]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      identified: { variant: 'outline', label: 'Identificada' },
      in_review: { variant: 'secondary', label: 'En revisión' },
      approved: { variant: 'default', label: 'Aprobada' },
      implemented: { variant: 'default', label: 'Implementada' },
      rejected: { variant: 'destructive', label: 'Rechazada' }
    };
    return config[status] || { variant: 'outline', label: status };
  };

  const upcomingEvents = calendar.filter(e => e.status === 'upcoming' || e.status === 'pending').slice(0, 5);

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Planificación Fiscal IA
                {summary && summary.potentialSavings > 0 && (
                  <Badge variant="default" className="text-xs bg-green-500">
                    {formatCurrency(summary.potentialSavings)} ahorro
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="summary" className="text-xs gap-1">
              <PieChart className="h-3 w-3" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="optimizations" className="text-xs gap-1">
              <Lightbulb className="h-3 w-3" />
              Optimizar
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs gap-1">
              <Calendar className="h-3 w-3" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="deductions" className="text-xs gap-1">
              <Target className="h-3 w-3" />
              Deducciones
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              {!summary ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Cargando resumen fiscal...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-xs text-muted-foreground">Impuesto Estimado</p>
                      <p className="text-xl font-bold">{formatCurrency(summary.estimatedAnnualTax)}</p>
                      <div className={cn(
                        "flex items-center gap-1 text-xs mt-1",
                        summary.yearOverYearChange < 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {summary.yearOverYearChange < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {Math.abs(summary.yearOverYearChange)}% vs año anterior
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-xs text-muted-foreground">Tipo Efectivo</p>
                      <p className="text-xl font-bold">{summary.effectiveTaxRate.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-green-500/10">
                      <p className="text-xs text-muted-foreground">Ahorro Potencial</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(summary.potentialSavings)}</p>
                      <p className="text-xs text-muted-foreground">{summary.optimizationsIdentified} oportunidades</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-xs text-muted-foreground">Score Cumplimiento</p>
                      <div className="flex items-center gap-2">
                        <Progress value={summary.complianceScore} className="flex-1 h-2" />
                        <span className="text-sm font-bold">{summary.complianceScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Deadlines */}
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Próximas Obligaciones</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {summary.upcomingDeadlines} pendientes
                      </Badge>
                    </div>
                    {upcomingEvents.length > 0 ? (
                      <div className="space-y-2">
                        {upcomingEvents.map((event) => (
                          <div key={event.id} className="flex items-center justify-between text-xs">
                            <span>{event.title}</span>
                            <span className="text-muted-foreground">
                              {new Date(event.dueDate).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No hay obligaciones próximas</p>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Optimizations Tab */}
          <TabsContent value="optimizations" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              <div className="space-y-3">
                {optimizations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Analizando oportunidades de optimización...</p>
                  </div>
                ) : (
                  optimizations.map((opt) => {
                    const statusConfig = getStatusBadge(opt.status);
                    return (
                      <div 
                        key={opt.id} 
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {opt.category === 'deduction' && <FileText className="h-4 w-4 text-blue-500" />}
                            {opt.category === 'credit' && <Zap className="h-4 w-4 text-purple-500" />}
                            {opt.category === 'timing' && <Clock className="h-4 w-4 text-orange-500" />}
                            {opt.category === 'structure' && <Shield className="h-4 w-4 text-green-500" />}
                            {opt.category === 'incentive' && <Target className="h-4 w-4 text-pink-500" />}
                            <span className="font-medium text-sm">{opt.title}</span>
                          </div>
                          <Badge variant={statusConfig.variant} className="text-xs">
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2">{opt.description}</p>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-green-600 font-bold">
                              Ahorro: {formatCurrency(opt.potentialSavings)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Complejidad: {opt.implementationComplexity === 'low' ? 'Baja' : opt.implementationComplexity === 'medium' ? 'Media' : 'Alta'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">IA:</span>
                            <span className="font-medium">{opt.aiConfidence}%</span>
                          </div>
                        </div>

                        {opt.status === 'identified' && (
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs flex-1"
                              onClick={() => updateOptimizationStatus(opt.id, 'in_review')}
                            >
                              Revisar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="h-7 text-xs flex-1"
                              onClick={() => updateOptimizationStatus(opt.id, 'approved')}
                            >
                              Aprobar
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              <div className="space-y-3">
                {calendar.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Cargando calendario fiscal...</p>
                  </div>
                ) : (
                  calendar.map((event) => (
                    <div 
                      key={event.id} 
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        event.status === 'overdue' ? 'bg-red-500/10 border-red-500/30' : 'bg-card hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {event.eventType === 'filing' && <FileText className="h-4 w-4 text-blue-500" />}
                          {event.eventType === 'payment' && <Calculator className="h-4 w-4 text-green-500" />}
                          {event.eventType === 'deadline' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          {event.eventType === 'review' && <Target className="h-4 w-4 text-purple-500" />}
                          <span className="font-medium text-sm">{event.title}</span>
                        </div>
                        <Badge 
                          variant={event.priority === 'critical' ? 'destructive' : event.priority === 'high' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {event.priority === 'critical' ? 'Crítico' : event.priority === 'high' ? 'Alto' : event.priority === 'medium' ? 'Medio' : 'Bajo'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{event.taxType}</Badge>
                          <span className="text-muted-foreground">{event.description}</span>
                        </div>
                        <span className={cn(
                          "font-medium",
                          event.status === 'overdue' ? 'text-red-600' : 'text-muted-foreground'
                        )}>
                          {new Date(event.dueDate).toLocaleDateString('es-ES')}
                        </span>
                      </div>

                      {event.estimatedAmount && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Importe estimado: </span>
                          <span className="font-bold">{formatCurrency(event.estimatedAmount)}</span>
                        </div>
                      )}

                      {event.status === 'completed' && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Completado
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Deductions Tab */}
          <TabsContent value="deductions" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              <div className="space-y-3">
                {deductions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Analizando deducciones disponibles...</p>
                  </div>
                ) : (
                  deductions.map((ded) => (
                    <div 
                      key={ded.id} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{ded.category}</span>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">Confianza:</span>
                          <span className="font-medium">{ded.confidence}%</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">{ded.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Aplicado:</span>
                          <span className="font-medium">{formatCurrency(ded.currentAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Máximo permitido:</span>
                          <span className="font-medium">{formatCurrency(ded.maxAllowable)}</span>
                        </div>
                        <Progress 
                          value={(ded.currentAmount / ded.maxAllowable) * 100} 
                          className="h-2" 
                        />
                        {ded.potentialAdditional > 0 && (
                          <div className="p-2 bg-green-500/10 rounded text-xs flex items-center justify-between">
                            <span>Potencial adicional:</span>
                            <span className="text-green-600 font-bold">{formatCurrency(ded.potentialAdditional)}</span>
                          </div>
                        )}
                      </div>

                      {ded.expiresAt && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                          <Clock className="h-3 w-3" />
                          Expira: {new Date(ded.expiresAt).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default TaxPlanningPanel;
