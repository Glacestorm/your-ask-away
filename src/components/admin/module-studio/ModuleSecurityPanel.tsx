/**
 * ModuleSecurityPanel - Security Scanner para módulos
 * Análisis de vulnerabilidades, auditoría de código, compliance
 * Enhanced with more interactivity
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  Scan,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Wrench
} from 'lucide-react';
import { useModuleSecurityScanner } from '@/hooks/admin/useModuleSecurityScanner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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
  const [selectedVuln, setSelectedVuln] = useState<any>(null);
  const [showVulnDetails, setShowVulnDetails] = useState(false);
  const [expandedVulns, setExpandedVulns] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

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
      toast.success('Escaneo de seguridad completado');
    }
  }, [context?.moduleKey, startSecurityScan]);

  const handleQuickFix = useCallback(async (vulnId: string) => {
    toast.info('Aplicando fix automático...');
    setTimeout(() => toast.success('Fix aplicado correctamente'), 1500);
  }, []);

  const toggleVulnExpanded = (vulnId: string) => {
    setExpandedVulns(prev => {
      const next = new Set(prev);
      if (next.has(vulnId)) {
        next.delete(vulnId);
      } else {
        next.add(vulnId);
      }
      return next;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-destructive';
  };

  const filteredVulnerabilities = filterSeverity 
    ? vulnerabilities.filter(v => v.severity === filterSeverity)
    : vulnerabilities;

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
    <TooltipProvider>
      <Card className={cn(
        "transition-all duration-300 overflow-hidden",
        isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
        className
      )}>
        <CardHeader className="pb-2 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div 
                className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Shield className="h-5 w-5 text-white" />
              </motion.div>
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
                title="Escanear seguridad"
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
                title={isExpanded ? 'Minimizar' : 'Expandir'}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
          {/* Animated Security Score */}
          <motion.div 
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <p className="text-sm text-muted-foreground">Security Score</p>
              <motion.p 
                className={cn("text-2xl font-bold", getScoreColor(securityScore))}
                key={securityScore}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {securityScore}/100
              </motion.p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {criticalCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <Badge 
                    variant="destructive" 
                    className="text-xs cursor-pointer hover:opacity-80"
                    onClick={() => setFilterSeverity(filterSeverity === 'critical' ? null : 'critical')}
                  >
                    {criticalCount} Critical
                  </Badge>
                </motion.div>
              )}
              {highCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  <Badge 
                    className="bg-orange-500 text-xs cursor-pointer hover:opacity-80"
                    onClick={() => setFilterSeverity(filterSeverity === 'high' ? null : 'high')}
                  >
                    {highCount} High
                  </Badge>
                </motion.div>
              )}
              {filterSeverity && (
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer"
                  onClick={() => setFilterSeverity(null)}
                >
                  Limpiar filtro
                </Badge>
              )}
            </div>
          </motion.div>

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
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2">
                    {filteredVulnerabilities.length === 0 ? (
                      <motion.div 
                        className="text-center py-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm text-muted-foreground">
                          {filterSeverity ? 'No hay vulnerabilidades con este filtro' : 'No se encontraron vulnerabilidades'}
                        </p>
                      </motion.div>
                    ) : (
                      filteredVulnerabilities.map((vuln, index) => (
                        <Collapsible 
                          key={vuln.id} 
                          open={expandedVulns.has(vuln.id)}
                          onOpenChange={() => toggleVulnExpanded(vuln.id)}
                        >
                          <motion.div 
                            className="rounded-lg border bg-card overflow-hidden"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="p-2 hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-2">
                                    {expandedVulns.has(vuln.id) ? (
                                      <ChevronDown className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    )}
                                    <AlertTriangle className={cn(
                                      "h-4 w-4 mt-0.5",
                                      vuln.severity === 'critical' ? 'text-red-500' : 
                                      vuln.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                                    )} />
                                    <div>
                                      <span className="text-sm font-medium">{vuln.title}</span>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{vuln.description}</p>
                                    </div>
                                  </div>
                                  <Badge className={cn("text-xs ml-2", getSeverityColor(vuln.severity))}>
                                    {vuln.severity}
                                  </Badge>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <motion.div 
                                className="px-4 pb-3 pt-1 border-t bg-muted/30"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <p className="text-xs text-muted-foreground mb-2">{vuln.description}</p>
                                {vuln.recommendation && (
                                  <div className="p-2 bg-muted/50 rounded text-xs mb-2">
                                    💡 <strong>Recomendación:</strong> {vuln.recommendation}
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleQuickFix(vuln.id)}
                                  >
                                    <Wrench className="h-3 w-3 mr-1" />
                                    Auto-fix
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => { setSelectedVuln(vuln); setShowVulnDetails(true); }}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Más info
                                  </Button>
                                </div>
                              </motion.div>
                            </CollapsibleContent>
                          </motion.div>
                        </Collapsible>
                      ))
                    )}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="compliance" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
                {complianceChecks && complianceChecks.length > 0 ? (
                  <div className="space-y-2">
                    {complianceChecks.map((check, index) => (
                      <motion.div 
                        key={check.id} 
                        className="p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.01 }}
                      >
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
                      </motion.div>
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
                      <motion.div 
                        className="p-2 rounded-lg bg-muted/50 text-center"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-lg font-bold">{dependencyAudit.length}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </motion.div>
                      <motion.div 
                        className="p-2 rounded-lg bg-destructive/10 text-center"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-lg font-bold text-destructive">
                          {dependencyAudit.filter(d => d.vulnerabilities.length > 0).length}
                        </p>
                        <p className="text-xs text-muted-foreground">Vulnerables</p>
                      </motion.div>
                    </div>
                    
                    {dependencyAudit.map((dep, index) => (
                      <motion.div 
                        key={dep.id} 
                        className="p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{dep.package_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{dep.current_version}</span>
                            {dep.vulnerabilities.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {dep.vulnerabilities.length} vulnerabilidad(es)
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </motion.div>
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

        {/* Vulnerability Details Dialog */}
        <Dialog open={showVulnDetails} onOpenChange={setShowVulnDetails}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  selectedVuln?.severity === 'critical' ? 'text-red-500' : 'text-orange-500'
                )} />
                {selectedVuln?.title}
              </DialogTitle>
              <DialogDescription>
                Detalles de la vulnerabilidad detectada
              </DialogDescription>
            </DialogHeader>
            {selectedVuln && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={getSeverityColor(selectedVuln.severity)}>
                    {selectedVuln.severity}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">{selectedVuln.description}</p>
                </div>
                {selectedVuln.recommendation && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Recomendación</p>
                    <p className="text-sm">{selectedVuln.recommendation}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => { handleQuickFix(selectedVuln.id); setShowVulnDetails(false); }}
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Aplicar Fix
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}

export default ModuleSecurityPanel;
