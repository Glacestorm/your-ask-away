import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  RefreshCw, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Shield,
  TrendingUp,
  Bell
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AdvisorAlertsList } from './AdvisorAlertsList';
import { AdvisorRecommendations } from './AdvisorRecommendations';
import { ProcessComplianceStatus } from './ProcessComplianceStatus';
import { AdvisorSettings } from './AdvisorSettings';

interface AnalysisResult {
  issues: any[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
  aiAnalysis?: any;
  timestamp: string;
}

export function AdvisorAgentPanel() {
  const { currentCompany } = useERPContext();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isActive, setIsActive] = useState(true);

  const runAnalysis = useCallback(async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-advisor-agent', {
        body: {
          action: 'analyze',
          company_id: currentCompany.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAnalysis(data);
        setIsActive(data.active !== false);
        
        if (data.summary?.errors > 0) {
          toast.warning(`Detectados ${data.summary.errors} problemas críticos`);
        }
      }
    } catch (err) {
      console.error('[AdvisorAgentPanel] Error:', err);
      toast.error('Error al analizar');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    if (currentCompany?.id) {
      runAnalysis();
    }
  }, [currentCompany?.id]);

  const getStatusColor = () => {
    if (!analysis) return 'bg-muted';
    if (analysis.summary.errors > 0) return 'bg-destructive';
    if (analysis.summary.warnings > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!analysis) return 'Sin análisis';
    if (analysis.summary.errors > 0) return 'Requiere atención';
    if (analysis.summary.warnings > 0) return 'Advertencias';
    return 'Todo correcto';
  };

  if (!currentCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Selecciona una empresa para activar el agente asesor</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg",
              isLoading && "animate-pulse"
            )}>
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Agente Asesor IA
                <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                  {isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Vigilancia continua y recomendaciones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
            <span className="text-xs text-muted-foreground">{getStatusText()}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={runAnalysis}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <Activity className="h-3 w-3" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs gap-1">
              <Bell className="h-3 w-3" />
              Alertas
              {analysis?.summary?.errors ? (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                  {analysis.summary.errors}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs gap-1">
              <Shield className="h-3 w-3" />
              Cumplimiento
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1">
              <Settings className="h-3 w-3" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className={cn(
                    "p-3 text-center",
                    analysis?.summary?.errors ? "bg-destructive/10 border-destructive/30" : "bg-muted/50"
                  )}>
                    <AlertTriangle className={cn(
                      "h-5 w-5 mx-auto mb-1",
                      analysis?.summary?.errors ? "text-destructive" : "text-muted-foreground"
                    )} />
                    <p className="text-2xl font-bold">{analysis?.summary?.errors || 0}</p>
                    <p className="text-xs text-muted-foreground">Críticos</p>
                  </Card>
                  <Card className={cn(
                    "p-3 text-center",
                    analysis?.summary?.warnings ? "bg-yellow-500/10 border-yellow-500/30" : "bg-muted/50"
                  )}>
                    <AlertTriangle className={cn(
                      "h-5 w-5 mx-auto mb-1",
                      analysis?.summary?.warnings ? "text-yellow-500" : "text-muted-foreground"
                    )} />
                    <p className="text-2xl font-bold">{analysis?.summary?.warnings || 0}</p>
                    <p className="text-xs text-muted-foreground">Advertencias</p>
                  </Card>
                  <Card className="p-3 text-center bg-green-500/10 border-green-500/30">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-2xl font-bold">{analysis?.summary?.info || 0}</p>
                    <p className="text-xs text-muted-foreground">Info</p>
                  </Card>
                </div>

                {/* AI Recommendations */}
                {analysis?.aiAnalysis && (
                  <AdvisorRecommendations analysis={analysis.aiAnalysis} />
                )}

                {/* Issues List */}
                {analysis?.issues && analysis.issues.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Problemas detectados</h4>
                    {analysis.issues.slice(0, 5).map((issue, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "p-3 rounded-lg border text-sm",
                          issue.severity === 'error' && "bg-destructive/5 border-destructive/20",
                          issue.severity === 'warning' && "bg-yellow-500/5 border-yellow-500/20",
                          issue.severity === 'info' && "bg-blue-500/5 border-blue-500/20"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {issue.severity === 'error' ? (
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          ) : issue.severity === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium">{issue.type?.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">{issue.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(!analysis?.issues || analysis.issues.length === 0) && !isLoading && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p className="font-medium">Todo en orden</p>
                    <p className="text-sm text-muted-foreground">No se han detectado problemas</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <AdvisorAlertsList companyId={currentCompany.id} />
          </TabsContent>

          <TabsContent value="compliance" className="mt-0">
            <ProcessComplianceStatus companyId={currentCompany.id} />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <AdvisorSettings companyId={currentCompany.id} onUpdate={runAnalysis} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AdvisorAgentPanel;
