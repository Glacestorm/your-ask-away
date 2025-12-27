/**
 * ModuleSecurityPanel - Security Scanner para módulos
 * Análisis de vulnerabilidades, auditoría de código, compliance
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Bug,
  Lock,
  FileWarning,
  Scan
} from 'lucide-react';
import { useModuleSecurityScanner } from '@/hooks/admin/useModuleSecurityScanner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModuleSecurityContext {
  moduleKey: string;
  moduleName?: string;
}

interface ModuleSecurityPanelProps {
  context: ModuleSecurityContext | null;
  className?: string;
}

export function ModuleSecurityPanel({ context, className }: ModuleSecurityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('vulnerabilities');

  const {
    isLoading,
    activeScan,
    vulnerabilities,
    complianceChecks,
    dependencyAudit,
    startSecurityScan,
    checkCompliance,
    auditDependencies,
  } = useModuleSecurityScanner();

  useEffect(() => {
    if (context?.moduleKey) {
      startSecurityScan(context.moduleKey, 'full');
    }
  }, [context?.moduleKey]);

  const handleFullScan = useCallback(async () => {
    if (context?.moduleKey) {
      await startSecurityScan(context.moduleKey, 'full');
    }
  }, [context?.moduleKey, startSecurityScan]);

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-destructive';
  };

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para escanear</p>
        </CardContent>
      </Card>
    );
  }

  const securityScore = activeScan?.security_score || 0;
  const criticalCount = activeScan?.critical_count || vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = activeScan?.high_count || vulnerabilities.filter(v => v.severity === 'high').length;

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Security Scanner</CardTitle>
              <p className="text-xs text-muted-foreground">
                {activeScan?.completed_at 
                  ? `Escaneado ${formatDistanceToNow(new Date(activeScan.completed_at), { locale: es, addSuffix: true })}`
                  : 'Sin escanear aún'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleFullScan}
              disabled={isLoading}
              className="h-8 w-8"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Scan className="h-4 w-4" />
              )}
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
        {/* Security Score */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Security Score</p>
            <p className={cn("text-2xl font-bold", getScoreColor(securityScore))}>
              {securityScore}/100
            </p>
          </div>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge className="bg-orange-500 text-xs">
                {highCount} High
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="vulnerabilities" className="text-xs">
              <Bug className="h-3 w-3 mr-1" />
              Vulnerabilidades
            </TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="text-xs">
              <FileWarning className="h-3 w-3 mr-1" />
              Dependencias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vulnerabilities" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
              <div className="space-y-2">
                {vulnerabilities.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-muted-foreground">No se encontraron vulnerabilidades</p>
                  </div>
                ) : (
                  vulnerabilities.map((vuln) => (
                    <div 
                      key={vuln.id} 
                      className="p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={cn(
                            "h-4 w-4 mt-0.5",
                            vuln.severity === 'critical' ? 'text-red-500' : 
                            vuln.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                          )} />
                          <div>
                            <span className="text-sm font-medium">{vuln.title}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{vuln.description}</p>
                          </div>
                        </div>
                        <Badge className={cn("text-xs", getSeverityColor(vuln.severity))}>
                          {vuln.severity}
                        </Badge>
                      </div>
                      {vuln.recommendation && (
                        <p className="text-xs text-muted-foreground mt-2 ml-6 p-2 bg-muted/50 rounded">
                          💡 {vuln.recommendation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compliance" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
              {complianceChecks && complianceChecks.length > 0 ? (
                <div className="space-y-2">
                  {complianceChecks.map((check) => (
                    <div key={check.id} className="p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {check.status === 'compliant' 
                            ? <CheckCircle className="h-4 w-4 text-green-500" />
                            : check.status === 'partial'
                            ? <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            : <XCircle className="h-4 w-4 text-destructive" />
                          }
                          <span className="text-sm">{check.control_name}</span>
                        </div>
                        <Badge 
                          variant={check.status === 'compliant' ? 'secondary' : 'destructive'} 
                          className="text-xs"
                        >
                          {check.status === 'compliant' ? 'PASS' : check.status === 'partial' ? 'PARTIAL' : 'FAIL'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ejecuta escaneo para ver compliance</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dependencies" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
              {dependencyAudit && dependencyAudit.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-center">
                      <p className="text-lg font-bold">{dependencyAudit.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-2 rounded-lg bg-destructive/10 text-center">
                      <p className="text-lg font-bold text-destructive">
                        {dependencyAudit.filter(d => d.vulnerabilities.length > 0).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Vulnerables</p>
                    </div>
                  </div>
                  
                  {dependencyAudit.map((dep) => (
                    <div key={dep.id} className="p-2 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{dep.package_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{dep.current_version}</span>
                          {dep.vulnerabilities.length > 0 && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <FileWarning className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ejecuta auditoría para ver dependencias</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleSecurityPanel;
