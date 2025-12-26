import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  MessageSquare,
  Calendar,
  Flame,
  FileText,
  Users,
  GraduationCap,
  Shield,
  ShieldAlert,
  FileSearch,
  BarChart3,
  AlertCircle,
  Download,
  Bell,
  Activity
} from 'lucide-react';
import { useRoleCopilot, CopilotSuggestion } from '@/hooks/useRoleCopilot';
import { CopilotSuggestionCard } from './CopilotSuggestionCard';
import { CopilotMetricsBar } from './CopilotMetricsBar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

// Mapa de iconos para quick actions
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  Flame,
  FileText,
  Users,
  AlertTriangle,
  GraduationCap,
  Shield,
  ShieldAlert,
  FileSearch,
  BarChart3,
  TrendingUp,
  CheckCircle: CheckCircle2,
  Zap,
  Bot,
  Sparkles,
  Clock,
  MessageSquare,
};

export function RoleCopilotPanel() {
  const {
    copilotConfig,
    session,
    metrics,
    currentSuggestions,
    isProcessing,
    configLoading,
    generateSuggestions,
    executeAction,
    dismissSuggestion,
    executeQuickAction,
    error,
    isError,
    clearError,
    lastRefresh,
    refetchSession,
  } = useRoleCopilot();

  const [activeTab, setActiveTab] = useState('suggestions');
  const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Datos para gráfico de tipos de sugerencias
  const suggestionTypeData = useMemo(() => {
    const counts = { action: 0, insight: 0, alert: 0 };
    currentSuggestions.forEach(s => {
      if (counts[s.type as keyof typeof counts] !== undefined) {
        counts[s.type as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Acciones', value: counts.action, color: CHART_COLORS[0] },
      { name: 'Insights', value: counts.insight, color: CHART_COLORS[1] },
      { name: 'Alertas', value: counts.alert, color: CHART_COLORS[2] },
    ].filter(d => d.value > 0);
  }, [currentSuggestions]);

  // Exportar PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    
    doc.setFontSize(18);
    doc.text('Informe Copiloto IA', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`, 20, 28);
    
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text('Resumen de Métricas', 20, 45);
    
    doc.setFontSize(10);
    doc.text(`• Acciones completadas: ${metrics?.actionsCompleted || 0}`, 25, 55);
    doc.text(`• Acciones descartadas: ${metrics?.actionsDismissed || 0}`, 25, 63);
    doc.text(`• Valor generado: €${(metrics?.totalValueGenerated || 0).toLocaleString()}`, 25, 71);
    doc.text(`• Impacto MRR: €${(metrics?.totalMrrImpact || 0).toLocaleString()}`, 25, 79);
    
    doc.setFontSize(14);
    doc.text('Sugerencias Activas', 20, 90);
    
    let yPos = 100;
    currentSuggestions.slice(0, 10).forEach((s, idx) => {
      doc.setFontSize(9);
      doc.text(`${idx + 1}. [${s.type.toUpperCase()}] ${s.title}`, 25, yPos);
      yPos += 8;
    });
    
    doc.save(`copilot-report-${now.getTime()}.pdf`);
    toast.success('Informe PDF descargado');
  };

  // Renderizar icono de quick action
  const renderQuickActionIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4" />;
    }
    return <span className="text-sm">{iconName}</span>;
  };

  if (configLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!copilotConfig) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
          <Bot className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            No hi ha configuració de copilot disponible per al teu rol
          </p>
        </CardContent>
      </Card>
    );
  }

  const getSuggestionsByType = (type: string) => 
    currentSuggestions.filter(s => s.type === type);

  const handleExecute = async (suggestion: CopilotSuggestion, actionId: string) => {
    await executeAction.mutateAsync({ suggestion, actionId });
  };

  const handleDismiss = async (suggestion: CopilotSuggestion, reason?: string) => {
    await dismissSuggestion.mutateAsync({ suggestion, reason });
  };

  // Componente para renderizar estado vacío en tabs
  const EmptyTabState = ({ type, icon: Icon }: { type: string; icon: React.ComponentType<{ className?: string }> }) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">
        No hi ha {type} actius
      </p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Genera suggeriments per veure recomanacions
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Error State */}
      {isError && error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error.message}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Refresh Indicator */}
      {lastRefresh && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Actualitzat {formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}
          </span>
          <Button variant="ghost" size="sm" onClick={() => refetchSession()} className="h-6 px-2">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Header with Copilot Info */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {copilotConfig.copilot_name}
                  <Badge variant="secondary" className="text-xs">
                    {copilotConfig.role}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {copilotConfig.copilot_description || 'Assistent IA personalitzat per al teu rol'}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => generateSuggestions()} 
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generant...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar Suggeriments
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CopilotMetricsBar metrics={metrics} isLoading={isProcessing && !metrics} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {copilotConfig.quick_actions && copilotConfig.quick_actions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Accions Ràpides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {copilotConfig.quick_actions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => executeQuickAction(action.id)}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {action.icon && renderQuickActionIcon(action.icon)}
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions Tabs */}
      <Card className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="suggestions" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Tots ({currentSuggestions.length})
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Accions ({getSuggestionsByType('action').length})
                </TabsTrigger>
                <TabsTrigger value="insights" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Insights ({getSuggestionsByType('insight').length})
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alertes ({getSuggestionsByType('alert').length})
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <TabsContent value="suggestions" className="mt-0 space-y-3">
                {currentSuggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      No hi ha suggeriments actius
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Fes clic a "Generar Suggeriments" per obtenir recomanacions IA
                    </p>
                  </div>
                ) : (
                  currentSuggestions.map((suggestion) => (
                    <CopilotSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onExecute={handleExecute}
                      onDismiss={handleDismiss}
                      isExecuting={executeAction.isPending}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="actions" className="mt-0 space-y-3">
                {getSuggestionsByType('action').length === 0 ? (
                  <EmptyTabState type="accions" icon={Zap} />
                ) : (
                  getSuggestionsByType('action').map((suggestion) => (
                    <CopilotSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onExecute={handleExecute}
                      onDismiss={handleDismiss}
                      isExecuting={executeAction.isPending}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="insights" className="mt-0 space-y-3">
                {getSuggestionsByType('insight').length === 0 ? (
                  <EmptyTabState type="insights" icon={TrendingUp} />
                ) : (
                  getSuggestionsByType('insight').map((suggestion) => (
                    <CopilotSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onExecute={handleExecute}
                      onDismiss={handleDismiss}
                      isExecuting={executeAction.isPending}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="alerts" className="mt-0 space-y-3">
                {getSuggestionsByType('alert').length === 0 ? (
                  <EmptyTabState type="alertes" icon={AlertTriangle} />
                ) : (
                  getSuggestionsByType('alert').map((suggestion) => (
                    <CopilotSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onExecute={handleExecute}
                      onDismiss={handleDismiss}
                      isExecuting={executeAction.isPending}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="analytics" className="mt-0 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Gráfico de tipos de sugerencias */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Distribución por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {suggestionTypeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={suggestionTypeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {suggestionTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                          Sin datos disponibles
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Métricas de rendimiento */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Rendimiento del Copiloto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tasa de aceptación</span>
                        <Badge variant="secondary">
                          {((metrics?.suggestionsAccepted || 0) / Math.max((metrics?.suggestionsAccepted || 0) + (metrics?.actionsDismissed || 0), 1) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Valor total generado</span>
                        <Badge variant="default" className="bg-green-500">
                          €{(metrics?.totalValueGenerated || 0).toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Sugerencias activas</span>
                        <Badge>{currentSuggestions.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Acciones ejecutadas</span>
                        <Badge variant="outline">{metrics?.actionsCompleted || 0}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </ScrollArea>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
