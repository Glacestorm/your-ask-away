/**
 * AntiPiracyDashboard - Panel de protección anti-pirateo
 * Fase 4 - Enterprise SaaS 2025-2026
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Activity,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  Zap,
  Clock,
  MapPin,
  Monitor,
  Users
} from 'lucide-react';
import { useLicenseAntiPiracy, type RiskAssessment, type AnomalyPattern } from '@/hooks/admin/enterprise/useLicenseAntiPiracy';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface AntiPiracyDashboardProps {
  className?: string;
}

export function AntiPiracyDashboard({ className }: AntiPiracyDashboardProps) {
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [configVisible, setConfigVisible] = useState(false);

  const {
    isAnalyzing,
    anomalies,
    riskAssessment,
    suspiciousActivities,
    blockedLicenses,
    config,
    assessRisk,
    blockLicense,
    unblockLicense,
    fetchSuspiciousActivities,
    startMonitoring,
    stopMonitoring
  } = useLicenseAntiPiracy();

  // Start monitoring on mount
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  const handleAnalyzeLicense = useCallback(async () => {
    if (!selectedLicenseId.trim()) {
      toast.error('Introduce un ID de licencia');
      return;
    }
    
    try {
      await assessRisk(selectedLicenseId);
      toast.success('Análisis completado');
    } catch (error) {
      toast.error('Error al analizar licencia');
    }
  }, [selectedLicenseId, assessRisk]);

  const getRiskBadge = (level: RiskAssessment['riskLevel']) => {
    const variants: Record<string, { color: string; icon: typeof Shield }> = {
      safe: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: ShieldCheck },
      low: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Shield },
      medium: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: ShieldAlert },
      high: { color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: ShieldAlert },
      critical: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: ShieldX }
    };
    
    const { color, icon: Icon } = variants[level] || variants.safe;
    
    return (
      <Badge className={cn('gap-1', color)}>
        <Icon className="h-3 w-3" />
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getAnomalyIcon = (type: AnomalyPattern['type']) => {
    switch (type) {
      case 'velocity': return <Zap className="h-4 w-4" />;
      case 'geographic': return <MapPin className="h-4 w-4" />;
      case 'device_cloning': return <Monitor className="h-4 w-4" />;
      case 'concurrent_abuse': return <Users className="h-4 w-4" />;
      case 'time_pattern': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: AnomalyPattern['severity']) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Protección Anti-Pirateo
          </h2>
          <p className="text-muted-foreground">
            Monitoreo y detección de uso fraudulento de licencias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuspiciousActivities}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigVisible(!configVisible)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actividades Sospechosas</p>
                <p className="text-2xl font-bold">{suspiciousActivities.filter(a => !a.resolved).length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Licencias Bloqueadas</p>
                <p className="text-2xl font-bold">{blockedLicenses.length}</p>
              </div>
              <Lock className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomalías Detectadas</p>
                <p className="text-2xl font-bold">{anomalies.length}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-bloqueo</p>
                <p className="text-2xl font-bold">
                  {config.enableAutoBlock ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <Shield className={cn(
                "h-8 w-8",
                config.enableAutoBlock ? "text-green-500" : "text-muted-foreground"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panel */}
      {configVisible && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración de Protección</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-block">Auto-bloqueo</Label>
                <Switch id="auto-block" checked={config.enableAutoBlock} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="velocity">Detección de velocidad</Label>
                <Switch id="velocity" checked={config.enableVelocityChecks} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="geo">Verificación geográfica</Label>
                <Switch id="geo" checked={config.enableGeoChecks} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="clone">Detección de clones</Label>
                <Switch id="clone" checked={config.enableDeviceCloneDetection} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="alerts">Alertas automáticas</Label>
                <Switch id="alerts" checked={config.alertOnSuspiciousActivity} />
              </div>
              <div className="space-y-2">
                <Label>Umbral de bloqueo: {config.blockThreshold}</Label>
                <Progress value={config.blockThreshold} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Análisis</TabsTrigger>
          <TabsTrigger value="activities">Actividades</TabsTrigger>
          <TabsTrigger value="blocked">Bloqueadas</TabsTrigger>
          <TabsTrigger value="realtime">Tiempo Real</TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analizar Licencia</CardTitle>
              <CardDescription>
                Introduce el ID de una licencia para realizar un análisis de riesgo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ID de licencia (UUID)"
                    value={selectedLicenseId}
                    onChange={(e) => setSelectedLicenseId(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={handleAnalyzeLicense}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Analizar
                    </>
                  )}
                </Button>
              </div>

              {/* Risk Assessment Result */}
              {riskAssessment && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Resultado del Análisis</h3>
                    {getRiskBadge(riskAssessment.riskLevel)}
                  </div>

                  {/* Score Gauge */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Puntuación de Riesgo</span>
                      <span className="font-bold">{riskAssessment.overallScore}/100</span>
                    </div>
                    <Progress 
                      value={riskAssessment.overallScore} 
                      className={cn(
                        "h-3",
                        riskAssessment.overallScore >= 85 ? "[&>div]:bg-destructive" :
                        riskAssessment.overallScore >= 65 ? "[&>div]:bg-orange-500" :
                        riskAssessment.overallScore >= 40 ? "[&>div]:bg-yellow-500" :
                        "[&>div]:bg-green-500"
                      )}
                    />
                  </div>

                  {/* Risk Factors */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Factores de Riesgo</h4>
                    {riskAssessment.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{factor.name}</p>
                          <p className="text-xs text-muted-foreground">{factor.description}</p>
                        </div>
                        <Badge variant="outline">{factor.score}</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {riskAssessment.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recomendaciones</h4>
                      <ul className="space-y-1">
                        {riskAssessment.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Auto Action */}
                  {riskAssessment.autoActionTaken && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm font-medium text-destructive flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {riskAssessment.autoActionTaken}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Detected Anomalies */}
              {anomalies.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-sm font-medium">Anomalías Detectadas</h4>
                  <div className="space-y-2">
                    {anomalies.map((anomaly, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("mt-1", getSeverityColor(anomaly.severity))}>
                            {getAnomalyIcon(anomaly.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{anomaly.description}</p>
                              <Badge 
                                variant="outline" 
                                className={getSeverityColor(anomaly.severity)}
                              >
                                {anomaly.severity}
                              </Badge>
                            </div>
                            <ul className="mt-1 space-y-0.5">
                              {anomaly.indicators.map((indicator, i) => (
                                <li key={i} className="text-xs text-muted-foreground">
                                  • {indicator}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-muted-foreground mt-1">
                              Confianza: {(anomaly.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actividades Sospechosas</CardTitle>
              <CardDescription>
                Historial de actividades detectadas como potencialmente fraudulentas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {suspiciousActivities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No hay actividades sospechosas registradas</p>
                    </div>
                  ) : (
                    suspiciousActivities.map((activity) => (
                      <div 
                        key={activity.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          activity.resolved ? "bg-muted/30" : "bg-card"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={activity.resolved ? "secondary" : "destructive"}>
                                {activity.activityType.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.detectedAt), { 
                                  locale: es, 
                                  addSuffix: true 
                                })}
                              </span>
                            </div>
                            <p className="text-sm mt-2 font-mono text-muted-foreground">
                              Licencia: {activity.licenseId.slice(0, 8)}...
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm">
                                Riesgo: <strong>{activity.riskScore}/100</strong>
                              </span>
                              {activity.resolved && activity.resolution && (
                                <span className="text-sm text-green-600">
                                  ✓ {activity.resolution}
                                </span>
                              )}
                            </div>
                          </div>
                          {!activity.resolved && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedLicenseId(activity.licenseId);
                                setActiveTab('overview');
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked Tab */}
        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Licencias Bloqueadas</CardTitle>
              <CardDescription>
                Licencias suspendidas por actividad fraudulenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {blockedLicenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Unlock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay licencias bloqueadas actualmente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockedLicenses.map((licenseId) => (
                      <div 
                        key={licenseId}
                        className="p-4 rounded-lg border bg-destructive/5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-destructive" />
                            <div>
                              <p className="font-mono text-sm">{licenseId}</p>
                              <p className="text-xs text-muted-foreground">
                                Bloqueada automáticamente
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => unblockLicense(licenseId, 'Desbloqueado manualmente')}
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Desbloquear
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Realtime Tab */}
        <TabsContent value="realtime">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                Monitoreo en Tiempo Real
              </CardTitle>
              <CardDescription>
                Vigilancia continua de actividad sospechosa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium">Sistema de monitoreo activo</span>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500/20">
                    Conectado
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Intervalo de escaneo</p>
                    <p className="text-xl font-bold">5 minutos</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Sesiones máximas</p>
                    <p className="text-xl font-bold">{config.maxConcurrentSessions}</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Timeout de sesión</p>
                    <p className="text-xl font-bold">{config.sessionTimeoutMinutes} min</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Umbral de bloqueo</p>
                    <p className="text-xl font-bold">{config.blockThreshold}%</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Detectores Activos</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      {config.enableVelocityChecks ? 
                        <ShieldCheck className="h-4 w-4 text-green-500" /> : 
                        <ShieldX className="h-4 w-4 text-muted-foreground" />
                      }
                      Velocidad de activación
                    </div>
                    <div className="flex items-center gap-2">
                      {config.enableGeoChecks ? 
                        <ShieldCheck className="h-4 w-4 text-green-500" /> : 
                        <ShieldX className="h-4 w-4 text-muted-foreground" />
                      }
                      Verificación geográfica
                    </div>
                    <div className="flex items-center gap-2">
                      {config.enableDeviceCloneDetection ? 
                        <ShieldCheck className="h-4 w-4 text-green-500" /> : 
                        <ShieldX className="h-4 w-4 text-muted-foreground" />
                      }
                      Detección de clones
                    </div>
                    <div className="flex items-center gap-2">
                      {config.alertOnSuspiciousActivity ? 
                        <ShieldCheck className="h-4 w-4 text-green-500" /> : 
                        <ShieldX className="h-4 w-4 text-muted-foreground" />
                      }
                      Alertas automáticas
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AntiPiracyDashboard;
