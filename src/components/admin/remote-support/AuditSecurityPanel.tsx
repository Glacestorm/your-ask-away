import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  FileText,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Activity
} from 'lucide-react';
import { useSupportAuditLogger } from '@/hooks/admin/support';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditSecurityPanelProps {
  sessionId?: string;
  className?: string;
}

export function AuditSecurityPanel({ sessionId, className }: AuditSecurityPanelProps) {
  const [activeTab, setActiveTab] = useState('trail');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    auditTrail,
    securityAnalysis,
    accessHistory,
    complianceReport,
    isLoading,
    getAuditTrail,
    analyzeSecurity,
    getAccessHistory,
    generateComplianceReport
  } = useSupportAuditLogger();

  useEffect(() => {
    getAuditTrail({ limit: 50 });
    getAccessHistory();
  }, []);

  const handleSecurityAnalysis = async () => {
    await analyzeSecurity();
  };

  const handleComplianceReport = async () => {
    await generateComplianceReport();
  };

  const filteredTrail = auditTrail.filter(entry =>
    entry.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.details && JSON.stringify(entry.details).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': case 'warning': return 'bg-yellow-500 text-white';
      case 'low': case 'info': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('auth')) return <Lock className="h-4 w-4" />;
    if (action.includes('access') || action.includes('view')) return <Eye className="h-4 w-4" />;
    if (action.includes('update') || action.includes('edit')) return <FileText className="h-4 w-4" />;
    if (action.includes('delete')) return <AlertTriangle className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Auditoría y Seguridad</CardTitle>
              <p className="text-xs text-muted-foreground">
                {auditTrail.length} registros • Última actualización hace momentos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSecurityAnalysis} disabled={isLoading}>
              <Shield className="h-4 w-4 mr-1" />
              Analizar
            </Button>
            <Button variant="outline" size="sm" onClick={() => getAuditTrail({ limit: 50 })} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="trail" className="text-xs">Auditoría</TabsTrigger>
            <TabsTrigger value="security" className="text-xs">Seguridad</TabsTrigger>
            <TabsTrigger value="access" className="text-xs">Accesos</TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="trail" className="mt-0">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en registros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredTrail.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 rounded bg-muted">
                            {getActionIcon(entry.action_type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{entry.action_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.details ? JSON.stringify(entry.details).slice(0, 50) : 'Sin detalles adicionales'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {entry.user_id?.slice(0, 8) || 'Sistema'}...
                              </span>
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(entry.timestamp), { 
                                  locale: es, 
                                  addSuffix: true 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {entry.entity_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {filteredTrail.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay registros de auditoría</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            {securityAnalysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {securityAnalysis.security_score}
                      </div>
                      <p className="text-xs text-muted-foreground">Security Score</p>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">
                        {securityAnalysis.threats_detected?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Amenazas</p>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {securityAnalysis.recommendations?.length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Recomendaciones</p>
                    </div>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Amenazas Detectadas</h4>
                  <ScrollArea className="h-[200px]">
                    {securityAnalysis.threats_detected?.map((threat, idx) => (
                      <div key={idx} className="p-2 rounded border mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{threat.description}</span>
                          <Badge className={getSeverityColor(threat.severity)}>
                            {threat.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {(!securityAnalysis.threats_detected || securityAnalysis.threats_detected.length === 0) && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No se detectaron amenazas
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-3">
                  No hay análisis de seguridad reciente
                </p>
                <Button onClick={handleSecurityAnalysis} disabled={isLoading}>
                  Ejecutar Análisis
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="access" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {accessHistory.map((access) => (
                  <div
                    key={access.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {access.success ? (
                          <Unlock className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{access.access_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {access.ip_address} • {access.device?.slice(0, 30)}...
                          </p>
                        </div>
                      </div>
                      <Badge variant={access.success ? 'default' : 'destructive'}>
                        {access.success ? 'Éxito' : 'Fallido'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {accessHistory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay historial de accesos</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compliance" className="mt-0">
            {complianceReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <h4 className="font-medium">Score de Cumplimiento</h4>
                    <p className="text-sm text-muted-foreground">
                      {complianceReport.frameworks?.length || 0} frameworks evaluados
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {complianceReport.overall_compliance_score}%
                    </div>
                    <Progress value={complianceReport.overall_compliance_score} className="w-24 mt-1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Frameworks</h4>
                  <ScrollArea className="h-[180px]">
                    {complianceReport.frameworks?.map((fw, idx) => (
                      <div key={idx} className="p-2 rounded border mb-2 flex items-start gap-2">
                        {fw.status === 'compliant' ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{fw.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {fw.compliance_level}% cumplimiento • {fw.findings?.length || 0} hallazgos
                          </p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-3">
                  No hay reporte de compliance generado
                </p>
                <Button onClick={handleComplianceReport} disabled={isLoading}>
                  Generar Reporte
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AuditSecurityPanel;
