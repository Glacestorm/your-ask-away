/**
 * ComplianceAuditPanel
 * Fase 5: Compliance & Audit AI
 * Panel de cumplimiento normativo y auditoría automatizada
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  RefreshCw, 
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Search,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  FileWarning,
  Scale,
  Maximize2,
  Minimize2,
  Settings,
  Play
} from 'lucide-react';
import { useObelixiaComplianceAudit, ComplianceCheck, ComplianceRule, AuditTrail } from '@/hooks/admin/obelixia-accounting/useObelixiaComplianceAudit';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ComplianceAuditPanelProps {
  fiscalConfigId?: string;
  className?: string;
}

export function ComplianceAuditPanel({ fiscalConfigId, className }: ComplianceAuditPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false);

  const {
    isLoading,
    rules,
    checks,
    auditTrail,
    currentReport,
    riskAssessment,
    error,
    lastCheck,
    fetchRules,
    runComplianceCheck,
    resolveComplianceIssue,
    fetchAuditTrail,
    generateAuditReport,
    getRiskAssessment,
    detectAnomalies,
    exportReport,
    getComplianceMetrics,
    startAutoCheck,
    stopAutoCheck
  } = useObelixiaComplianceAudit();

  // Initialize
  useEffect(() => {
    fetchRules();
    runComplianceCheck({ fiscalConfigId });
    fetchAuditTrail();
    getRiskAssessment();
  }, []);

  // Auto check toggle
  useEffect(() => {
    if (autoCheckEnabled) {
      startAutoCheck({ fiscalConfigId }, 300000); // 5 min
    } else {
      stopAutoCheck();
    }
  }, [autoCheckEnabled, fiscalConfigId]);

  const metrics = getComplianceMetrics();

  const filteredChecks = selectedCategory === 'all' 
    ? checks 
    : checks.filter(c => c.category === selectedCategory);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ShieldX className="h-4 w-4 text-red-500" />;
      case 'high': return <ShieldAlert className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'low': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <ShieldCheck className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"><CheckCircle className="h-3 w-3 mr-1" />Cumple</Badge>;
      case 'failed':
        return <Badge variant="destructive"><ShieldX className="h-3 w-3 mr-1" />Incumple</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"><AlertTriangle className="h-3 w-3 mr-1" />Alerta</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'low': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingDown className="h-4 w-4 text-emerald-500" />;
      case 'worsening': return <TrendingUp className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      fiscal: 'Fiscal',
      contable: 'Contable',
      laboral: 'Laboral',
      rgpd: 'RGPD',
      blanqueo: 'Blanqueo',
      societario: 'Societario'
    };
    return names[category] || category;
  };

  const handleGenerateReport = async () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    await generateAuditReport(
      'compliance',
      startOfYear.toISOString().split('T')[0],
      today.toISOString().split('T')[0],
      'Informe de Cumplimiento Normativo'
    );
    setShowReportDialog(false);
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Compliance & Audit AI
                <Badge variant="outline" className="text-xs">Fase 5</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastCheck 
                  ? `Última verificación ${formatDistanceToNow(lastCheck, { locale: es, addSuffix: true })}`
                  : 'Sin verificar'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => runComplianceCheck({ fiscalConfigId })}
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
        {/* Metrics Summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{metrics.complianceScore}%</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.passed}</p>
            <p className="text-xs text-muted-foreground">Cumple</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.failed}</p>
            <p className="text-xs text-muted-foreground">Incumple</p>
          </div>
          <div className={cn("text-center p-2 rounded-lg", getRiskLevelColor(metrics.riskLevel))}>
            <p className="text-2xl font-bold capitalize">{metrics.riskLevel}</p>
            <p className="text-xs text-muted-foreground">Riesgo</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="checks" className="text-xs">Verificaciones</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Auditoría</TabsTrigger>
            <TabsTrigger value="config" className="text-xs">Config</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[280px]"}>
              <div className="space-y-4">
                {/* Risk Assessment */}
                {riskAssessment && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Evaluación de Riesgos
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {riskAssessment.categories?.slice(0, 4).map((cat, idx) => (
                        <div key={idx} className="p-2 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground">{cat.category}</span>
                            {getTrendIcon(cat.trend)}
                          </div>
                          <Progress value={100 - cat.score} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {cat.issues_count} issues
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Failed Checks */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                    <ShieldAlert className="h-4 w-4" />
                    Incumplimientos Activos
                  </h4>
                  {checks.filter(c => c.status === 'failed').slice(0, 5).map((check) => (
                    <div key={check.id} className="p-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(check.severity)}
                          <div>
                            <p className="text-sm font-medium text-foreground">{check.rule_name}</p>
                            <p className="text-xs text-muted-foreground">{check.message}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(check.category)}
                        </Badge>
                      </div>
                      {check.recommendations && check.recommendations.length > 0 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          💡 {check.recommendations[0]}
                        </p>
                      )}
                    </div>
                  ))}
                  {checks.filter(c => c.status === 'failed').length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                      <p className="text-sm">Sin incumplimientos activos</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => detectAnomalies()}
                    disabled={isLoading}
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Detectar Anomalías
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setShowReportDialog(true)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Generar Informe
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Checks Tab */}
          <TabsContent value="checks" className="flex-1 mt-0">
            <div className="mb-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Filtrar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="fiscal">Fiscal</SelectItem>
                  <SelectItem value="contable">Contable</SelectItem>
                  <SelectItem value="laboral">Laboral</SelectItem>
                  <SelectItem value="rgpd">RGPD</SelectItem>
                  <SelectItem value="blanqueo">Blanqueo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className={isExpanded ? "h-[calc(100vh-360px)]" : "h-[240px]"}>
              <div className="space-y-2">
                {filteredChecks.map((check) => (
                  <div 
                    key={check.id} 
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      check.status === 'failed' && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10",
                      check.status === 'warning' && "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10",
                      check.status === 'passed' && "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(check.severity)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{check.rule_name}</p>
                            <Badge variant="outline" className="text-xs">{check.rule_code}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
                        </div>
                      </div>
                      {getStatusBadge(check.status)}
                    </div>
                    {check.status === 'failed' && (
                      <div className="mt-2 flex justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => resolveComplianceIssue(check.id, 'Resuelto manualmente', 'current_user')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Marcar Resuelto
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[280px]"}>
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Registro de Auditoría
                </h4>
                {auditTrail.map((entry) => (
                  <div key={entry.id} className="p-2 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "p-1 rounded",
                          entry.action_type === 'create' && "bg-emerald-100 dark:bg-emerald-900/30",
                          entry.action_type === 'update' && "bg-blue-100 dark:bg-blue-900/30",
                          entry.action_type === 'delete' && "bg-red-100 dark:bg-red-900/30",
                          entry.action_type === 'approve' && "bg-purple-100 dark:bg-purple-900/30"
                        )}>
                          <FileText className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {entry.user_name} - {entry.action_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.entity_type}: {entry.entity_name || entry.entity_id}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.timestamp), 'dd/MM HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                {auditTrail.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Sin registros de auditoría</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[280px]"}>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label className="font-medium">Verificación Automática</Label>
                    <p className="text-xs text-muted-foreground">Ejecutar cada 5 minutos</p>
                  </div>
                  <Switch 
                    checked={autoCheckEnabled} 
                    onCheckedChange={setAutoCheckEnabled} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Reglas Activas</Label>
                  {rules.slice(0, 6).map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(rule.severity)}
                        <div>
                          <p className="text-sm font-medium text-foreground">{rule.rule_code}</p>
                          <p className="text-xs text-muted-foreground">{rule.rule_name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rule.check_frequency}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => runComplianceCheck({ fiscalConfigId })}
                  disabled={isLoading}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Ejecutar Verificación Completa
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Informe de Auditoría</DialogTitle>
            <DialogDescription>
              Se generará un informe completo de cumplimiento normativo
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              El informe incluirá:
            </p>
            <ul className="text-sm list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>Resumen de cumplimiento por categoría</li>
              <li>Hallazgos y no conformidades</li>
              <li>Evaluación de riesgos</li>
              <li>Recomendaciones de mejora</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ComplianceAuditPanel;
