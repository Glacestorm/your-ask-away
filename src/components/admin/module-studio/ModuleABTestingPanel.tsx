/**
 * ModuleABTestingPanel - Sistema de A/B Testing para módulos
 * Configurador de experimentos, dashboard de métricas, selector de winner
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  FlaskConical,
  Play,
  Pause,
  Trophy,
  Users,
  TrendingUp,
  BarChart3,
  Plus,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { useModuleABTesting, ABExperiment } from '@/hooks/admin/useModuleABTesting';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleABTestingPanelProps {
  moduleKey?: string;
  className?: string;
}

export function ModuleABTestingPanel({ moduleKey, className }: ModuleABTestingPanelProps) {
  const [activeTab, setActiveTab] = useState('experiments');

  const {
    experiments,
    activeExperiment,
    results,
    isLoading,
    isAnalyzing,
    fetchExperiments,
    startExperiment,
    pauseExperiment,
    getExperimentResults,
    declareWinner,
    selectExperiment
  } = useModuleABTesting(moduleKey);

  useEffect(() => {
    if (moduleKey) fetchExperiments();
  }, [moduleKey, fetchExperiments]);

  const handleViewResults = async (experiment: ABExperiment) => {
    selectExperiment(experiment);
    await getExperimentResults(experiment.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (!moduleKey) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-12 text-center">
          <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para gestionar A/B Tests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">A/B Testing</CardTitle>
              <CardDescription className="text-xs">
                {experiments.filter(e => e.status === 'running').length} experimentos activos
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Nuevo Test
            </Button>
            <Button variant="ghost" size="icon" onClick={() => fetchExperiments()} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="experiments" className="text-xs gap-1">
              <FlaskConical className="h-3 w-3" /> Experimentos
            </TabsTrigger>
            <TabsTrigger value="results" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" /> Resultados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="experiments" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {experiments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Sin experimentos</p>
                    <p className="text-xs mt-1">Crea un nuevo A/B test para empezar</p>
                  </div>
                ) : (
                  experiments.map((experiment) => (
                    <motion.div
                      key={experiment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md",
                        activeExperiment?.id === experiment.id && "ring-2 ring-primary"
                      )}
                      onClick={() => handleViewResults(experiment)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{experiment.name}</h4>
                          <Badge className={cn("text-xs gap-1", getStatusColor(experiment.status))}>
                            {getStatusIcon(experiment.status)} {experiment.status}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          {experiment.status === 'draft' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                startExperiment(experiment.id);
                              }}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          {experiment.status === 'running' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                pauseExperiment(experiment.id);
                              }}
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">{experiment.description}</p>

                      {/* Variants Preview */}
                      <div className="flex gap-2 mb-3">
                        {experiment.variants.map((variant) => (
                          <div 
                            key={variant.id}
                            className="flex-1 p-2 rounded bg-muted/50 text-center"
                          >
                            <span className="text-xs font-medium">{variant.name}</span>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{variant.metrics.users}</span>
                              <TrendingUp className="h-3 w-3 text-muted-foreground ml-2" />
                              <span className="text-xs">{variant.metrics.conversionRate.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Significance */}
                      {experiment.statisticalSignificance > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Significancia estadística</span>
                            <span className={cn(
                              "font-medium",
                              experiment.statisticalSignificance >= 95 ? "text-green-600" : "text-muted-foreground"
                            )}>
                              {experiment.statisticalSignificance.toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={experiment.statisticalSignificance} 
                            className="h-1.5"
                          />
                        </div>
                      )}

                      {experiment.winner && (
                        <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">
                            Ganador: {experiment.variants.find(v => v.id === experiment.winner)?.name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {experiment.startDate 
                          ? `Iniciado ${formatDistanceToNow(new Date(experiment.startDate), { locale: es, addSuffix: true })}`
                          : 'Sin iniciar'
                        }
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            {!activeExperiment ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Selecciona un experimento para ver resultados</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <h4 className="font-medium text-sm mb-1">{activeExperiment.name}</h4>
                  <p className="text-xs text-muted-foreground">{activeExperiment.hypothesis}</p>
                </div>

                {isAnalyzing ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Analizando resultados...</p>
                  </div>
                ) : results ? (
                  <div className="space-y-4">
                    {/* Total Users */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Total participantes</span>
                      </div>
                      <span className="font-bold">{results.totalUsers.toLocaleString()}</span>
                    </div>

                    {/* Variant Results */}
                    <div className="space-y-3">
                      {results.variantResults.map((variant) => (
                        <div 
                          key={variant.variantId}
                          className={cn(
                            "p-4 rounded-lg border bg-card",
                            variant.isWinner && "ring-2 ring-green-500"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{variant.variantName}</span>
                              {variant.isWinner && (
                                <Badge className="gap-1 bg-green-500">
                                  <Trophy className="h-3 w-3" /> Ganador
                                </Badge>
                              )}
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              variant.improvement > 0 ? "text-green-600" : variant.improvement < 0 ? "text-red-600" : ""
                            )}>
                              {variant.improvement > 0 ? '+' : ''}{variant.improvement.toFixed(1)}%
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-2 rounded bg-muted/50">
                              <p className="text-xs text-muted-foreground">Usuarios</p>
                              <p className="font-bold">{variant.users.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-2 rounded bg-muted/50">
                              <p className="text-xs text-muted-foreground">Conversiones</p>
                              <p className="font-bold">{variant.conversions.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-2 rounded bg-muted/50">
                              <p className="text-xs text-muted-foreground">Tasa</p>
                              <p className="font-bold">{variant.conversionRate.toFixed(2)}%</p>
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Confianza</span>
                              <span>{variant.confidence.toFixed(1)}%</span>
                            </div>
                            <Progress value={variant.confidence} className="h-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Analysis Notes */}
                    {results.analysisNotes.length > 0 && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <h5 className="text-sm font-medium text-blue-600 mb-2">Análisis IA</h5>
                        <ul className="text-xs text-blue-600/80 space-y-1">
                          {results.analysisNotes.map((note, i) => (
                            <li key={i}>• {note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    {results.isSignificant && !activeExperiment.winner && (
                      <div className="flex gap-2">
                        {results.variantResults.map(v => (
                          <Button 
                            key={v.variantId}
                            variant={v.isWinner ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => declareWinner(activeExperiment.id, v.variantId)}
                          >
                            <Trophy className="h-4 w-4 mr-1" />
                            Declarar {v.variantName} ganador
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleABTestingPanel;
