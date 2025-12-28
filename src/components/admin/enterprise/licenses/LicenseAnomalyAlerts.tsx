/**
 * LicenseAnomalyAlerts - Alertas de anomalías en licencias
 * Fase 3 del Sistema de Licencias Enterprise
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Shield, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Laptop,
  Activity,
  Eye,
  Ban,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AnomalyAlert {
  id: string;
  license_id: string;
  alert_type: string;
  severity: string;
  description: string;
  status: string;
  details: any;
  resolution_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  license?: {
    licensee_email: string;
    licensee_name: string;
  };
}

const alertTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  multiple_ips: { icon: MapPin, label: 'Múltiples IPs', color: 'text-amber-500' },
  device_mismatch: { icon: Laptop, label: 'Fingerprint Inconsistente', color: 'text-orange-500' },
  unusual_hours: { icon: Clock, label: 'Horario Inusual', color: 'text-blue-500' },
  rapid_validations: { icon: Activity, label: 'Validaciones Rápidas', color: 'text-purple-500' },
  suspicious_pattern: { icon: AlertTriangle, label: 'Patrón Sospechoso', color: 'text-red-500' },
};

const severityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Baja', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  medium: { label: 'Media', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  high: { label: 'Alta', className: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  critical: { label: 'Crítica', className: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

export function LicenseAnomalyAlerts() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('license_anomaly_alerts')
        .select(`
          *,
          license:licenses(licensee_email, licensee_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'unresolved') {
        query = query.neq('status', 'resolved');
      } else if (filter === 'resolved') {
        query = query.eq('status', 'resolved');
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setAlerts((data || []).map((a: any) => ({
        ...a,
        license: Array.isArray(a.license) ? a.license[0] : a.license
      })));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const handleResolve = async (alertId: string, dismiss: boolean = false) => {
    setResolvingId(alertId);
    try {
      const { error } = await supabase
        .from('license_anomaly_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: dismiss ? 'Descartada por admin' : 'Investigada y resuelta'
        })
        .eq('id', alertId);

      if (error) throw error;

      toast.success(dismiss ? 'Alerta descartada' : 'Alerta resuelta');
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Error al resolver alerta');
    } finally {
      setResolvingId(null);
    }
  };

  const unresolvedCount = alerts.filter(a => a.status !== 'resolved').length;
  const criticalCount = alerts.filter(a => a.status !== 'resolved' && a.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn(
          "border-l-4",
          unresolvedCount > 0 ? "border-l-amber-500" : "border-l-emerald-500"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas Pendientes</p>
                <p className="text-3xl font-bold">{unresolvedCount}</p>
              </div>
              <AlertTriangle className={cn(
                "h-8 w-8",
                unresolvedCount > 0 ? "text-amber-500" : "text-emerald-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-l-4",
          criticalCount > 0 ? "border-l-red-500" : "border-l-emerald-500"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticas</p>
                <p className="text-3xl font-bold">{criticalCount}</p>
              </div>
              <Shield className={cn(
                "h-8 w-8",
                criticalCount > 0 ? "text-red-500" : "text-emerald-500"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Histórico</p>
                <p className="text-3xl font-bold">{alerts.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Alertas de Anomalías
              </CardTitle>
              <CardDescription>
                Detección de uso sospechoso de licencias
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  variant={filter === 'unresolved' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unresolved')}
                  className="rounded-none"
                >
                  Pendientes
                </Button>
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="rounded-none"
                >
                  Todas
                </Button>
                <Button
                  variant={filter === 'resolved' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('resolved')}
                  className="rounded-none"
                >
                  Resueltas
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-4 text-emerald-500" />
                <p className="text-lg font-medium">Sin alertas</p>
                <p className="text-sm">No hay anomalías detectadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const typeInfo = alertTypeConfig[alert.alert_type] || alertTypeConfig.suspicious_pattern;
                  const severityInfo = severityConfig[alert.severity] || severityConfig.medium;
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        alert.status === 'resolved' 
                          ? "bg-muted/50 opacity-60" 
                          : "bg-card hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg bg-muted", typeInfo.color)}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{typeInfo.label}</span>
                              <Badge className={severityInfo.className}>
                                {severityInfo.label}
                              </Badge>
                              {alert.status === 'resolved' && (
                                <Badge variant="outline" className="text-emerald-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resuelta
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                <strong>Licencia:</strong> {alert.license?.licensee_email || 'N/A'}
                              </span>
                              <span>
                                {formatDistanceToNow(new Date(alert.created_at), { 
                                  locale: es, 
                                  addSuffix: true 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {alert.status !== 'resolved' && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolve(alert.id, false)}
                              disabled={resolvingId === alert.id}
                            >
                              {resolvingId === alert.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Resolver
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResolve(alert.id, true)}
                              disabled={resolvingId === alert.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default LicenseAnomalyAlerts;
