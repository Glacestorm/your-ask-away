/**
 * SmartReconciliationPanel - Fase 7: Automated Reconciliation & Smart Matching
 * Panel de conciliación automática con IA
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  RefreshCw, 
  Sparkles, 
  Link2,
  Check,
  X,
  Zap,
  FileText,
  TrendingUp,
  Settings,
  Brain,
  ArrowLeftRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useObelixiaSmartReconciliation, ReconciliationMatch } from '@/hooks/admin/obelixia-accounting/useObelixiaSmartReconciliation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SmartReconciliationPanelProps {
  className?: string;
}

export function SmartReconciliationPanel({ className }: SmartReconciliationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  const [reconciliationType, setReconciliationType] = useState<'bank' | 'ar' | 'ap' | 'intercompany'>('bank');
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.85]);
  const [selectedMatch, setSelectedMatch] = useState<ReconciliationMatch | null>(null);

  const {
    isLoading,
    matches,
    rules,
    currentSession,
    stats,
    error,
    lastRefresh,
    startReconciliation,
    confirmMatch,
    rejectMatch,
    autoMatchBatch,
    fetchRules,
    fetchStats,
    learnFromMatch
  } = useObelixiaSmartReconciliation();

  // Cargar datos iniciales
  useEffect(() => {
    fetchStats();
    fetchRules();
  }, [fetchStats, fetchRules]);

  // Iniciar conciliación
  const handleStartReconciliation = useCallback(async () => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    await startReconciliation({
      reconciliationType,
      dateRange: {
        start: monthAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
    });
  }, [reconciliationType, startReconciliation]);

  // Auto-match
  const handleAutoMatch = useCallback(async () => {
    await autoMatchBatch(confidenceThreshold[0]);
  }, [autoMatchBatch, confidenceThreshold]);

  // Confirmar match
  const handleConfirmMatch = useCallback(async (matchId: string) => {
    await confirmMatch(matchId);
    await learnFromMatch(matchId);
  }, [confirmMatch, learnFromMatch]);

  // Rechazar match
  const handleRejectMatch = useCallback(async (matchId: string) => {
    await rejectMatch(matchId);
  }, [rejectMatch]);

  // Obtener color según confianza
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.7) return 'text-yellow-500';
    return 'text-orange-500';
  };

  // Obtener badge según estado
  const getStatusBadge = (status: ReconciliationMatch['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rechazado</Badge>;
      case 'auto_matched':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Auto</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendiente</Badge>;
    }
  };

  // Calcular estadísticas de matches
  const matchStats = {
    pending: matches.filter(m => m.status === 'pending').length,
    confirmed: matches.filter(m => m.status === 'confirmed').length,
    rejected: matches.filter(m => m.status === 'rejected').length,
    autoMatched: matches.filter(m => m.status === 'auto_matched').length,
    highConfidence: matches.filter(m => m.matchConfidence >= 0.9).length
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Smart Reconciliation
                <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  Fase 7
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Conciliación automática con IA'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
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
            <TabsTrigger value="matches" className="text-xs">
              <ArrowLeftRight className="h-3 w-3 mr-1" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="rules" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Reglas
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              IA
            </TabsTrigger>
          </TabsList>

          {/* Tab: Matches */}
          <TabsContent value="matches" className="flex-1 mt-0 space-y-3">
            {/* Controles */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={reconciliationType} onValueChange={(v) => setReconciliationType(v as typeof reconciliationType)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bancaria</SelectItem>
                  <SelectItem value="ar">Cuentas Cobrar</SelectItem>
                  <SelectItem value="ap">Cuentas Pagar</SelectItem>
                  <SelectItem value="intercompany">Intercompañía</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                size="sm" 
                onClick={handleStartReconciliation}
                disabled={isLoading}
                className="h-8 text-xs"
              >
                {isLoading ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Iniciar
              </Button>

              {matches.length > 0 && (
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handleAutoMatch}
                  disabled={isLoading}
                  className="h-8 text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Auto-Match ({matchStats.highConfidence})
                </Button>
              )}
            </div>

            {/* Sesión actual */}
            {currentSession && (
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <p className="text-lg font-bold text-primary">{currentSession.totalItems}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10 text-center">
                  <p className="text-lg font-bold text-green-500">{matchStats.confirmed + matchStats.autoMatched}</p>
                  <p className="text-[10px] text-muted-foreground">Conciliados</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
                  <p className="text-lg font-bold text-yellow-500">{matchStats.pending}</p>
                  <p className="text-[10px] text-muted-foreground">Pendientes</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-lg font-bold text-blue-500">{Math.round((matchStats.confirmed + matchStats.autoMatched) / Math.max(matches.length, 1) * 100)}%</p>
                  <p className="text-[10px] text-muted-foreground">Progreso</p>
                </div>
              </div>
            )}

            {/* Lista de matches */}
            <ScrollArea className={isExpanded ? "h-[calc(100vh-380px)]" : "h-[200px]"}>
              {error ? (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  {error}
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inicia una conciliación para ver matches</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {matches.map((match) => (
                    <div 
                      key={match.id} 
                      className={cn(
                        "p-3 rounded-lg border bg-card transition-colors",
                        selectedMatch?.id === match.id ? "ring-2 ring-primary" : "hover:bg-muted/50",
                        match.status === 'confirmed' && "opacity-60"
                      )}
                      onClick={() => setSelectedMatch(match)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Source */}
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">{match.sourceType}</Badge>
                            <span className="text-xs font-medium truncate">{match.sourceDescription}</span>
                          </div>
                          
                          {/* Target */}
                          <div className="flex items-center gap-2">
                            <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="outline" className="text-[10px]">{match.targetType}</Badge>
                            <span className="text-xs truncate">{match.targetDescription}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {/* Importe y confianza */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              {match.sourceAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </span>
                            <span className={cn("text-xs font-medium", getConfidenceColor(match.matchConfidence))}>
                              {Math.round(match.matchConfidence * 100)}%
                            </span>
                          </div>
                          
                          {/* Estado */}
                          {getStatusBadge(match.status)}
                        </div>
                      </div>

                      {/* Diferencia */}
                      {match.differenceAmount !== 0 && (
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                          Diferencia: {match.differenceAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                      )}

                      {/* Acciones */}
                      {match.status === 'pending' && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-xs text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmMatch(match.id);
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Confirmar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectMatch(match.id);
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}

                      {/* Razón del match */}
                      <p className="mt-1 text-[10px] text-muted-foreground italic">
                        {match.matchReason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab: Reglas */}
          <TabsContent value="rules" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
              <div className="space-y-2">
                {rules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay reglas configuradas</p>
                    <p className="text-xs">Las reglas se crean automáticamente al confirmar matches</p>
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div key={rule.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{rule.ruleName}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{rule.ruleType}</Badge>
                          {rule.isActive ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{rule.sourceField} → {rule.targetField}</span>
                        <span>{rule.matchCount} matches</span>
                      </div>
                      <Progress 
                        value={rule.confidenceThreshold * 100} 
                        className="h-1 mt-2" 
                      />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Estadísticas */}
          <TabsContent value="stats" className="flex-1 mt-0">
            {stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 text-center">
                    <p className="text-2xl font-bold text-green-500">{stats.autoMatchRate}%</p>
                    <p className="text-xs text-muted-foreground">Auto-Match Rate</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-center">
                    <p className="text-2xl font-bold text-blue-500">{stats.accuracy}%</p>
                    <p className="text-xs text-muted-foreground">Precisión</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-center">
                    <p className="text-2xl font-bold text-purple-500">{stats.savedHours}h</p>
                    <p className="text-xs text-muted-foreground">Horas Ahorradas</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-card">
                  <h4 className="text-sm font-medium mb-2">Tendencia Semanal</h4>
                  <div className="space-y-2">
                    {stats.trendsWeekly?.slice(-4).map((week, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">{week.week}</span>
                        <div className="flex-1 flex gap-1">
                          <div 
                            className="h-4 bg-blue-500/50 rounded" 
                            style={{ width: `${(week.autoMatched / (week.autoMatched + week.manualMatched)) * 100}%` }}
                          />
                          <div 
                            className="h-4 bg-purple-500/50 rounded" 
                            style={{ width: `${(week.manualMatched / (week.autoMatched + week.manualMatched)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs">{week.autoMatched + week.manualMatched}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500/50 rounded" />
                      <span>Auto</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-500/50 rounded" />
                      <span>Manual</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Cargando estadísticas...</p>
              </div>
            )}
          </TabsContent>

          {/* Tab: IA */}
          <TabsContent value="ai" className="flex-1 mt-0 space-y-4">
            <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Configuración IA</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm">Umbral de Confianza para Auto-Match</label>
                    <span className="text-sm font-medium">{Math.round(confidenceThreshold[0] * 100)}%</span>
                  </div>
                  <Slider
                    value={confidenceThreshold}
                    onValueChange={setConfidenceThreshold}
                    min={0.5}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Matches con confianza ≥ {Math.round(confidenceThreshold[0] * 100)}% se aplicarán automáticamente
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Capacidades IA</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Matching por importe exacto y con tolerancia
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Fuzzy matching de descripciones
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Detección de referencias cruzadas
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Aprendizaje de patrones manuales
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Sugerencia de reglas automáticas
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default SmartReconciliationPanel;
