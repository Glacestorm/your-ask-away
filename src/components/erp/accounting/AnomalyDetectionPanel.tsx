/**
 * AnomalyDetectionPanel - Panel de detección de anomalías y fraude con IA
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Loader2,
  TrendingUp,
  Zap,
  FileWarning,
  Search
} from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Anomaly {
  id: string;
  type: 'fraud' | 'error' | 'unusual' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affected_entries: string[];
  confidence: number;
  detected_at: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  recommendations: string[];
}

interface ScanResult {
  total_entries_scanned: number;
  anomalies_found: number;
  risk_score: number;
  scan_duration_ms: number;
  last_scan: string;
}

interface AnomalyDetectionPanelProps {
  className?: string;
}

export function AnomalyDetectionPanel({ className }: AnomalyDetectionPanelProps) {
  const { currentCompany } = useERPContext();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  const handleRunScan = useCallback(async () => {
    if (!currentCompany?.id) return;

    setIsScanning(true);

    try {
      const { data, error } = await supabase.functions.invoke('erp-anomaly-detection', {
        body: {
          action: 'run_full_scan',
          params: {
            company_id: currentCompany.id,
            country_code: currentCompany.country
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setScanResult({
          total_entries_scanned: data.entries_scanned || 0,
          anomalies_found: data.anomalies?.length || 0,
          risk_score: data.risk_score || 0,
          scan_duration_ms: data.duration_ms || 0,
          last_scan: new Date().toISOString()
        });
        setAnomalies(data.anomalies || []);
        
        if (data.anomalies?.length > 0) {
          toast.warning(`Se encontraron ${data.anomalies.length} anomalías`);
        } else {
          toast.success('Análisis completado sin anomalías');
        }
      }
    } catch (err) {
      console.error('[AnomalyDetectionPanel] Error:', err);
      toast.error('Error en el análisis');
    } finally {
      setIsScanning(false);
    }
  }, [currentCompany]);

  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
    }
  };

  const getTypeIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'fraud': return <Shield className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'unusual': return <TrendingUp className="h-4 w-4" />;
      case 'compliance': return <FileWarning className="h-4 w-4" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-600';
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600">
              <Shield className="h-4 w-4 text-white" />
            </div>
            Detección de Anomalías y Fraude
            <HelpTooltip
              type="warning"
              title="IA Anti-Fraude"
              content="Sistema de detección basado en IA que analiza patrones contables para identificar errores, fraudes y anomalías."
            />
          </CardTitle>
          <Button
            onClick={handleRunScan}
            disabled={isScanning}
            size="sm"
            className="gap-2"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Analizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan Results Summary */}
        {scanResult && (
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{scanResult.total_entries_scanned}</p>
              <p className="text-xs text-muted-foreground">Asientos analizados</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className={cn("text-2xl font-bold", scanResult.anomalies_found > 0 ? 'text-orange-500' : 'text-green-600')}>
                {scanResult.anomalies_found}
              </p>
              <p className="text-xs text-muted-foreground">Anomalías</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className={cn("text-2xl font-bold", getRiskColor(scanResult.risk_score))}>
                {scanResult.risk_score}%
              </p>
              <p className="text-xs text-muted-foreground">Riesgo</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{(scanResult.scan_duration_ms / 1000).toFixed(1)}s</p>
              <p className="text-xs text-muted-foreground">Duración</p>
            </div>
          </div>
        )}

        {/* Risk Score Bar */}
        {scanResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Nivel de Riesgo Global</span>
              <span className={cn("font-medium", getRiskColor(scanResult.risk_score))}>
                {scanResult.risk_score}%
              </span>
            </div>
            <Progress 
              value={scanResult.risk_score} 
              className={cn(
                "h-2",
                scanResult.risk_score >= 80 && "[&>div]:bg-red-600",
                scanResult.risk_score >= 60 && scanResult.risk_score < 80 && "[&>div]:bg-orange-500",
                scanResult.risk_score >= 40 && scanResult.risk_score < 60 && "[&>div]:bg-yellow-500",
                scanResult.risk_score < 40 && "[&>div]:bg-green-600"
              )}
            />
          </div>
        )}

        {/* Anomalies List */}
        {anomalies.length > 0 ? (
          <ScrollArea className="h-[250px]">
            <div className="space-y-2 pr-4">
              {anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedAnomaly?.id === anomaly.id && "border-primary bg-muted/50"
                  )}
                  onClick={() => setSelectedAnomaly(anomaly)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      anomaly.severity === 'critical' && 'bg-red-100 dark:bg-red-900/30 text-red-600',
                      anomaly.severity === 'high' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
                      anomaly.severity === 'medium' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
                      anomaly.severity === 'low' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    )}>
                      {getTypeIcon(anomaly.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{anomaly.title}</p>
                        <Badge className={cn("text-xs", getSeverityColor(anomaly.severity))}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {anomaly.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Confianza: {anomaly.confidence}%</span>
                        <span>•</span>
                        <span>{anomaly.affected_entries.length} asientos afectados</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : !isScanning && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ejecuta un análisis para detectar anomalías</p>
          </div>
        )}

        {/* Selected Anomaly Details */}
        {selectedAnomaly && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recomendaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {selectedAnomaly.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Zap className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

export default AnomalyDetectionPanel;
