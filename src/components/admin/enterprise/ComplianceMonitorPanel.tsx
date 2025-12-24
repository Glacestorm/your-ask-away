/**
 * ComplianceMonitorPanel
 * Dashboard de Compliance con métricas, violaciones y predicción de riesgos
 * Fase 11 - Enterprise SaaS 2025-2026
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
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Scan,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap
} from 'lucide-react';
import { useComplianceMonitor, type ComplianceContext } from '@/hooks/admin/useComplianceMonitor';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ComplianceMonitorPanelProps {
  context?: ComplianceContext;
  className?: string;
}

export function ComplianceMonitorPanel({ 
  context = { sector: 'banca', scanDepth: 'standard' },
  className 
}: ComplianceMonitorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('status');
  const [isScanning, setIsScanning] = useState(false);

  const {
    isLoading,
    metrics,
    rules,
    violations,
    predictedRisks,
    error,
    lastRefresh,
    getComplianceStatus,
    runComplianceScan,
    resolveViolation,
    startAutoRefresh,
    stopAutoRefresh
  } = useComplianceMonitor();

  // Auto-refresh cada 2 minutos
  useEffect(() => {
    startAutoRefresh(context, 120000);
    return () => stopAutoRefresh();
  }, [context.sector, context.organizationId]);

  const handleRefresh = useCallback(async () => {
    await getComplianceStatus(context);
  }, [context, getComplianceStatus]);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    await runComplianceScan(context);
    setIsScanning(false);
  }, [context, runComplianceScan]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'non_compliant': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <span className="h-4 w-4 text-muted-foreground">—</span>;
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Compliance Monitor
                {metrics && (
                  <Badge variant="outline" className={cn(
                    metrics.overallScore >= 80 ? 'border-green-500 text-green-600' :
                    metrics.overallScore >= 60 ? 'border-yellow-500 text-yellow-600' :
                    'border-destructive text-destructive'
                  )}>
                    {metrics.overallScore}%
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
              onClick={handleScan}
              disabled={isLoading || isScanning}
              className="h-8 w-8"
            >
              <Scan className={cn("h-4 w-4", isScanning && "animate-pulse")} />
            </Button>
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
        {error ? (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {error.message}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-3">
              <TabsTrigger value="status" className="text-xs">Estado</TabsTrigger>
              <TabsTrigger value="violations" className="text-xs">
                Violaciones
                {violations.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                    {violations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="predictions" className="text-xs">Predicciones</TabsTrigger>
              <TabsTrigger value="rules" className="text-xs">Reglas</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                <div className="space-y-4">
                  {/* Score Card */}
                  {metrics && (
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Puntuación Global</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(metrics.trend)}
                          <span className="text-2xl font-bold">{metrics.overallScore}%</span>
                        </div>
                      </div>
                      <Progress value={metrics.overallScore} className="h-2" />
                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-lg font-semibold text-green-600">{metrics.compliantRules}</p>
                          <p className="text-xs text-muted-foreground">Cumplidas</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-lg font-semibold text-yellow-600">{metrics.violations}</p>
                          <p className="text-xs text-muted-foreground">Violaciones</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-lg font-semibold text-destructive">{metrics.criticalViolations}</p>
                          <p className="text-xs text-muted-foreground">Críticas</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-xs text-muted-foreground">Total Reglas</p>
                      <p className="text-xl font-bold">{metrics?.totalRules || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-xs text-muted-foreground">Último Escaneo</p>
                      <p className="text-sm font-medium">
                        {metrics?.lastFullScan 
                          ? formatDistanceToNow(new Date(metrics.lastFullScan), { locale: es, addSuffix: true })
                          : 'Nunca'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="violations" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                {violations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                    <p className="text-sm">No hay violaciones activas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {violations.map((violation) => (
                      <div key={violation.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getSeverityColor(violation.severity)}>
                                {violation.severity}
                              </Badge>
                              <span className="text-sm font-medium">{violation.ruleName}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{violation.description}</p>
                            <p className="text-xs text-primary">{violation.suggestedAction}</p>
                          </div>
                          {violation.autoResolvable && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveViolation(violation.id, { action: 'auto', autoApply: true })}
                              className="h-7 text-xs"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Auto-fix
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="predictions" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                {predictedRisks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Shield className="h-8 w-8 mb-2" />
                    <p className="text-sm">Sin riesgos predichos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {predictedRisks.map((risk) => (
                      <div key={risk.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{risk.ruleName}</span>
                          <Badge variant="outline">{Math.round(risk.probability * 100)}% prob.</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Fecha estimada: {new Date(risk.expectedDate).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-xs text-primary">{risk.preventiveAction}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="rules" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                {rules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Shield className="h-8 w-8 mb-2" />
                    <p className="text-sm">Cargando reglas...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rules.map((rule) => (
                      <div key={rule.id} className="p-3 rounded-lg border bg-card flex items-center gap-3">
                        {getStatusIcon(rule.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">{rule.code}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{rule.category}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default ComplianceMonitorPanel;
