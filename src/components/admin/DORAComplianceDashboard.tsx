import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Shield, AlertTriangle, CheckCircle, Clock, FileText, 
  Users, Server, Activity, Plus, RefreshCw, Download,
  AlertCircle, Target, Zap, Building2, ExternalLink, Play, 
  Loader2, CheckCircle2, XCircle, AlertOctagon
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ComplianceItem {
  id: string;
  article: string;
  requirement_category: string;
  requirement_title: string;
  requirement_description: string | null;
  implementation_status: string;
  evidence_description: string | null;
  priority: string;
  target_date: string | null;
  completion_date: string | null;
}

interface SecurityIncident {
  id: string;
  incident_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  detection_time: string;
  reported_to_authority: boolean;
}

interface RiskAssessment {
  id: string;
  assessment_name: string;
  assessment_type: string;
  risk_score: number | null;
  risk_level: string | null;
  status: string;
  assessment_date: string;
}

interface ResilienceTest {
  id: string;
  test_name: string;
  test_type: string;
  test_date: string;
  status: string;
  critical_findings_count: number;
  high_findings_count: number;
  remediation_status: string;
}

interface ThirdPartyProvider {
  id: string;
  provider_name: string;
  provider_type: string;
  criticality: string;
  risk_score: number | null;
  status: string;
  sla_compliance_rate: number | null;
}

interface StressTestSimulation {
  id: string;
  simulation_name: string;
  simulation_type: string;
  scenario_description: string | null;
  target_systems: string[] | null;
  execution_mode: string;
  status: string;
  last_execution: string | null;
  passed: boolean | null;
  results: Record<string, unknown>[] | null;
  metrics: Record<string, number> | null;
  execution_duration_seconds: number | null;
}

export function DORAComplianceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [resilienceTests, setResilienceTests] = useState<ResilienceTest[]>([]);
  const [thirdPartyProviders, setThirdPartyProviders] = useState<ThirdPartyProvider[]>([]);
  const [stressTests, setStressTests] = useState<StressTestSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [showNewIncidentDialog, setShowNewIncidentDialog] = useState(false);
  const [showNewRiskDialog, setShowNewRiskDialog] = useState(false);
  const [showNewTestDialog, setShowNewTestDialog] = useState(false);
  const [showNewProviderDialog, setShowNewProviderDialog] = useState(false);
  const [showNewStressTestDialog, setShowNewStressTestDialog] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadComplianceItems(),
      loadIncidents(),
      loadRiskAssessments(),
      loadResilienceTests(),
      loadThirdPartyProviders(),
      loadStressTests()
    ]);
    setLoading(false);
  };

  const loadStressTests = async () => {
    const { data, error } = await supabase
      .from('stress_test_simulations')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setStressTests(data as unknown as StressTestSimulation[]);
  };

  const runStressTest = async (simulationId: string) => {
    setRunningTest(simulationId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-stress-test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session?.access_token}`
          },
          body: JSON.stringify({ simulation_id: simulationId })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Test completado: ${result.passed ? 'PASADO' : 'FALLIDO'}`);
        loadStressTests();
      } else {
        toast.error(result.error || 'Error ejecutando test');
      }
    } catch (error) {
      console.error('Error running stress test:', error);
      toast.error('Error ejecutando stress test');
    } finally {
      setRunningTest(null);
    }
  };

  const runAllStressTests = async () => {
    const automatedTests = stressTests.filter(t => t.execution_mode === 'automated');
    if (automatedTests.length === 0) {
      toast.info('No hay tests automatizados configurados');
      return;
    }
    
    toast.info(`Ejecutando ${automatedTests.length} tests automatizados...`);
    
    for (const test of automatedTests) {
      await runStressTest(test.id);
    }
    
    toast.success('Todos los tests automatizados completados');
  };

  const loadComplianceItems = async () => {
    const { data, error } = await supabase
      .from('dora_compliance_items')
      .select('*')
      .order('priority', { ascending: false });
    if (!error && data) setComplianceItems(data);
  };

  const loadIncidents = async () => {
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .order('detection_time', { ascending: false });
    if (!error && data) setIncidents(data);
  };

  const loadRiskAssessments = async () => {
    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*')
      .order('assessment_date', { ascending: false });
    if (!error && data) setRiskAssessments(data);
  };

  const loadResilienceTests = async () => {
    const { data, error } = await supabase
      .from('resilience_tests')
      .select('*')
      .order('test_date', { ascending: false });
    if (!error && data) setResilienceTests(data);
  };

  const loadThirdPartyProviders = async () => {
    const { data, error } = await supabase
      .from('third_party_providers')
      .select('*')
      .order('criticality', { ascending: true });
    if (!error && data) setThirdPartyProviders(data);
  };

  const updateComplianceStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('dora_compliance_items')
      .update({ 
        implementation_status: status,
        completion_date: status === 'implemented' || status === 'verified' ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', id);
    
    if (error) {
      toast.error("Error al actualizar estado");
    } else {
      toast.success("Estado actualizado");
      loadComplianceItems();
    }
  };

  // Calculate compliance metrics
  const totalItems = complianceItems.length;
  const implementedItems = complianceItems.filter(i => i.implementation_status === 'implemented' || i.implementation_status === 'verified').length;
  const compliancePercentage = totalItems > 0 ? Math.round((implementedItems / totalItems) * 100) : 0;
  
  const openIncidents = incidents.filter(i => i.status !== 'closed').length;
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length;
  
  const pendingTests = resilienceTests.filter(t => t.status === 'scheduled').length;
  const criticalFindings = resilienceTests.reduce((sum, t) => sum + (t.critical_findings_count || 0), 0);
  
  const criticalProviders = thirdPartyProviders.filter(p => p.criticality === 'critical').length;
  const avgRiskScore = riskAssessments.length > 0 
    ? Math.round(riskAssessments.reduce((sum, r) => sum + (r.risk_score || 0), 0) / riskAssessments.length)
    : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
      case 'verified':
      case 'completed':
      case 'closed':
        return 'bg-green-500 text-white';
      case 'in_progress':
      case 'investigating':
        return 'bg-blue-500 text-white';
      case 'not_started':
      case 'open':
      case 'pending':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ict_risk_management': return <Shield className="h-4 w-4" />;
      case 'incident_reporting': return <AlertTriangle className="h-4 w-4" />;
      case 'resilience_testing': return <Target className="h-4 w-4" />;
      case 'third_party_risk': return <Building2 className="h-4 w-4" />;
      case 'information_sharing': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ict_risk_management': return 'Gestión de Riesgos TIC';
      case 'incident_reporting': return 'Notificación de Incidentes';
      case 'resilience_testing': return 'Pruebas de Resiliencia';
      case 'third_party_risk': return 'Riesgo de Terceros';
      case 'information_sharing': return 'Intercambio de Información';
      default: return category;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'No iniciado';
      case 'in_progress': return 'En progreso';
      case 'implemented': return 'Implementado';
      case 'verified': return 'Verificado';
      case 'not_applicable': return 'No aplica';
      default: return status;
    }
  };

  // Group compliance items by category
  const groupedCompliance = complianceItems.reduce((acc, item) => {
    if (!acc[item.requirement_category]) {
      acc[item.requirement_category] = [];
    }
    acc[item.requirement_category].push(item);
    return acc;
  }, {} as Record<string, ComplianceItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Marco DORA y NIS2
          </h2>
          <p className="text-muted-foreground">
            Gestión de cumplimiento normativo y resiliencia operativa digital
          </p>
        </div>
        <Button onClick={loadAllData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplimiento DORA</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compliancePercentage}%</div>
            <Progress value={compliancePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {implementedItems} de {totalItems} requisitos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidentes Abiertos</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${criticalIncidents > 0 ? 'text-destructive' : 'text-yellow-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openIncidents}</div>
            {criticalIncidents > 0 && (
              <p className="text-xs text-destructive mt-1">
                {criticalIncidents} crítico(s)
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pruebas Pendientes</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTests}</div>
            {criticalFindings > 0 && (
              <p className="text-xs text-destructive mt-1">
                {criticalFindings} hallazgos críticos sin resolver
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntuación de Riesgo</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRiskScore}/100</div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalProviders} proveedores críticos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Cumplimiento</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes</TabsTrigger>
          <TabsTrigger value="risks">Riesgos</TabsTrigger>
          <TabsTrigger value="tests">Pruebas</TabsTrigger>
          <TabsTrigger value="stress">Stress Test</TabsTrigger>
          <TabsTrigger value="providers">Terceros</TabsTrigger>
        </TabsList>

        {/* Compliance Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checklist de Cumplimiento DORA</CardTitle>
              <CardDescription>
                Estado de implementación de requisitos según el Reglamento (UE) 2022/2554
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedCompliance).map(([category, items]) => {
                  const categoryImplemented = items.filter(i => 
                    i.implementation_status === 'implemented' || i.implementation_status === 'verified'
                  ).length;
                  const categoryProgress = Math.round((categoryImplemented / items.length) * 100);
                  
                  return (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 w-full">
                          {getCategoryIcon(category)}
                          <span className="font-medium">{getCategoryLabel(category)}</span>
                          <Badge variant="outline" className="ml-auto mr-4">
                            {categoryImplemented}/{items.length}
                          </Badge>
                          <div className="w-24">
                            <Progress value={categoryProgress} className="h-2" />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {items.map(item => (
                            <div 
                              key={item.id} 
                              className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                            >
                              <Badge className={getPriorityColor(item.priority)}>
                                {item.priority.toUpperCase()}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{item.article}</span>
                                  <span className="font-medium">{item.requirement_title}</span>
                                </div>
                                {item.requirement_description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.requirement_description}
                                  </p>
                                )}
                              </div>
                              <Select
                                value={item.implementation_status}
                                onValueChange={(value) => updateComplianceStatus(item.id, value)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[9999] bg-popover">
                                  <SelectItem value="not_started">No iniciado</SelectItem>
                                  <SelectItem value="in_progress">En progreso</SelectItem>
                                  <SelectItem value="implemented">Implementado</SelectItem>
                                  <SelectItem value="verified">Verificado</SelectItem>
                                  <SelectItem value="not_applicable">No aplica</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registro de Incidentes de Seguridad</CardTitle>
                <CardDescription>
                  Gestión de incidentes TIC según Art. 17-23 DORA
                </CardDescription>
              </div>
              <Dialog open={showNewIncidentDialog} onOpenChange={setShowNewIncidentDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Incidente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Registrar Incidente de Seguridad</DialogTitle>
                    <DialogDescription>
                      Registre un nuevo incidente para seguimiento y notificación
                    </DialogDescription>
                  </DialogHeader>
                  <IncidentForm 
                    onSuccess={() => {
                      setShowNewIncidentDialog(false);
                      loadIncidents();
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Severidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notificado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map(incident => (
                    <TableRow key={incident.id}>
                      <TableCell className="text-sm">
                        {format(new Date(incident.detection_time), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">{incident.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{incident.incident_type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {incident.reported_to_authority ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {incidents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay incidentes registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessments Tab */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Evaluaciones de Riesgo</CardTitle>
                <CardDescription>
                  Análisis de riesgos TIC según Art. 5-13 DORA
                </CardDescription>
              </div>
              <Dialog open={showNewRiskDialog} onOpenChange={setShowNewRiskDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Evaluación
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nueva Evaluación de Riesgo</DialogTitle>
                  </DialogHeader>
                  <RiskAssessmentForm 
                    onSuccess={() => {
                      setShowNewRiskDialog(false);
                      loadRiskAssessments();
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {riskAssessments.map(assessment => (
                  <Card key={assessment.id} className="relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      assessment.risk_level === 'critical' ? 'bg-destructive' :
                      assessment.risk_level === 'high' ? 'bg-orange-500' :
                      assessment.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{assessment.assessment_name}</CardTitle>
                      <CardDescription>{assessment.assessment_type.replace('_', ' ')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">{assessment.risk_score || 0}</p>
                          <p className="text-xs text-muted-foreground">Puntuación de riesgo</p>
                        </div>
                        <Badge className={getStatusColor(assessment.status)}>
                          {assessment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(assessment.assessment_date), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {riskAssessments.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No hay evaluaciones de riesgo registradas
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resilience Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pruebas de Resiliencia</CardTitle>
                <CardDescription>
                  Pentesting, Red/Blue Team y pruebas de continuidad (Art. 24-27 DORA)
                </CardDescription>
              </div>
              <Dialog open={showNewTestDialog} onOpenChange={setShowNewTestDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Prueba
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Programar Prueba de Resiliencia</DialogTitle>
                  </DialogHeader>
                  <ResilienceTestForm 
                    onSuccess={() => {
                      setShowNewTestDialog(false);
                      loadResilienceTests();
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Hallazgos</TableHead>
                    <TableHead>Remediación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resilienceTests.map(test => (
                    <TableRow key={test.id}>
                      <TableCell className="text-sm">
                        {format(new Date(test.test_date), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">{test.test_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{test.test_type.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {test.critical_findings_count > 0 && (
                            <Badge className="bg-destructive text-destructive-foreground">
                              {test.critical_findings_count} C
                            </Badge>
                          )}
                          {test.high_findings_count > 0 && (
                            <Badge className="bg-orange-500 text-white">
                              {test.high_findings_count} H
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(test.remediation_status)}>
                          {test.remediation_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {resilienceTests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay pruebas de resiliencia registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Third Party Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestión de Terceros TIC</CardTitle>
                <CardDescription>
                  Supervisión de proveedores según Art. 28-44 DORA
                </CardDescription>
              </div>
              <Dialog open={showNewProviderDialog} onOpenChange={setShowNewProviderDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proveedor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Registrar Proveedor TIC</DialogTitle>
                  </DialogHeader>
                  <ThirdPartyProviderForm 
                    onSuccess={() => {
                      setShowNewProviderDialog(false);
                      loadThirdPartyProviders();
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Criticidad</TableHead>
                    <TableHead>Riesgo</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thirdPartyProviders.map(provider => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.provider_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{provider.provider_type.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(provider.criticality)}>
                          {provider.criticality.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {provider.risk_score ? `${provider.risk_score}/100` : '-'}
                      </TableCell>
                      <TableCell>
                        {provider.sla_compliance_rate ? `${provider.sla_compliance_rate}%` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(provider.status)}>
                          {provider.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {thirdPartyProviders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay proveedores registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stress Tests Tab */}
        <TabsContent value="stress" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Simulaciones de Stress Test Automatizadas</CardTitle>
                <CardDescription>
                  Pruebas automatizadas de resiliencia del sistema según Art. 24-27 DORA
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={runAllStressTests} variant="default" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Ejecutar Todos
                </Button>
                <Dialog open={showNewStressTestDialog} onOpenChange={setShowNewStressTestDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Simulación
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nueva Simulación de Stress Test</DialogTitle>
                    </DialogHeader>
                    <StressTestForm 
                      onSuccess={() => {
                        setShowNewStressTestDialog(false);
                        loadStressTests();
                      }} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stressTests.map(test => (
                  <Card key={test.id} className="relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      test.status === 'completed' && test.passed ? 'bg-green-500' :
                      test.status === 'failed' || (test.status === 'completed' && !test.passed) ? 'bg-destructive' :
                      test.status === 'running' ? 'bg-blue-500' : 'bg-muted'
                    }`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{test.simulation_name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {test.execution_mode === 'automated' ? 'Auto' : 
                           test.execution_mode === 'scheduled' ? 'Progr.' : 'Manual'}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {test.scenario_description?.slice(0, 80)}...
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={
                          test.simulation_type === 'cyber_attack' ? 'bg-destructive text-destructive-foreground' :
                          test.simulation_type === 'failover' ? 'bg-orange-500 text-white' :
                          test.simulation_type === 'availability' ? 'bg-blue-500 text-white' :
                          'bg-muted text-muted-foreground'
                        }>
                          {test.simulation_type.replace(/_/g, ' ')}
                        </Badge>
                        {test.passed !== null && (
                          <Badge className={test.passed ? 'bg-green-500 text-white' : 'bg-destructive text-destructive-foreground'}>
                            {test.passed ? 'PASADO' : 'FALLIDO'}
                          </Badge>
                        )}
                      </div>

                      {test.target_systems && (
                        <div className="flex flex-wrap gap-1">
                          {test.target_systems.map((sys, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {sys}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {test.metrics && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Éxito:</span>
                            <span className="font-medium">{test.metrics.success_rate?.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duración:</span>
                            <span className="font-medium">{test.execution_duration_seconds}s</span>
                          </div>
                        </div>
                      )}

                      {test.last_execution && (
                        <p className="text-xs text-muted-foreground">
                          Última: {format(new Date(test.last_execution), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      )}

                      <Button 
                        onClick={() => runStressTest(test.id)} 
                        disabled={runningTest === test.id}
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                      >
                        {runningTest === test.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Ejecutando...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Ejecutar Test
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {stressTests.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No hay simulaciones de stress test configuradas
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Forms
function IncidentForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incident_type: 'other',
    severity: 'medium',
    detection_time: new Date().toISOString().slice(0, 16)
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('security_incidents').insert({
      ...formData,
      reported_by: userData.user?.id
    });
    
    if (error) {
      toast.error("Error al crear incidente");
    } else {
      toast.success("Incidente registrado");
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de incidente</label>
          <select 
            value={formData.incident_type} 
            onChange={(e) => setFormData({...formData, incident_type: e.target.value})}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="cyber_attack">Ciberataque</option>
            <option value="data_breach">Brecha de datos</option>
            <option value="system_failure">Fallo de sistema</option>
            <option value="third_party_incident">Incidente de terceros</option>
            <option value="fraud">Fraude</option>
            <option value="operational_disruption">Interrupción operativa</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Severidad</label>
          <select 
            value={formData.severity} 
            onChange={(e) => setFormData({...formData, severity: e.target.value})}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="critical">Crítico</option>
            <option value="high">Alto</option>
            <option value="medium">Medio</option>
            <option value="low">Bajo</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Título</label>
        <Input 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción</label>
        <Textarea 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Fecha/Hora de detección</label>
        <Input 
          type="datetime-local"
          value={formData.detection_time}
          onChange={(e) => setFormData({...formData, detection_time: e.target.value})}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Guardando..." : "Registrar Incidente"}
      </Button>
    </form>
  );
}

function RiskAssessmentForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    assessment_name: '',
    assessment_type: 'ict_risk',
    scope: '',
    risk_score: 50,
    assessment_date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('risk_assessments').insert({
      ...formData,
      assessor_id: userData.user?.id
    });
    
    if (error) {
      toast.error("Error al crear evaluación");
    } else {
      toast.success("Evaluación registrada");
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre de la evaluación</label>
        <Input 
          value={formData.assessment_name}
          onChange={(e) => setFormData({...formData, assessment_name: e.target.value})}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo</label>
          <select 
            value={formData.assessment_type} 
            onChange={(e) => setFormData({...formData, assessment_type: e.target.value})}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="ict_risk">Riesgo TIC</option>
            <option value="third_party_risk">Riesgo de terceros</option>
            <option value="operational_risk">Riesgo operacional</option>
            <option value="cyber_risk">Riesgo cibernético</option>
            <option value="compliance_risk">Riesgo de cumplimiento</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha</label>
          <Input 
            type="date"
            value={formData.assessment_date}
            onChange={(e) => setFormData({...formData, assessment_date: e.target.value})}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Alcance</label>
        <Textarea 
          value={formData.scope}
          onChange={(e) => setFormData({...formData, scope: e.target.value})}
          required
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Puntuación de riesgo: {formData.risk_score}</label>
        <Input 
          type="range"
          min="0"
          max="100"
          value={formData.risk_score}
          onChange={(e) => setFormData({...formData, risk_score: parseInt(e.target.value)})}
        />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Guardando..." : "Crear Evaluación"}
      </Button>
    </form>
  );
}

function ResilienceTestForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    test_name: '',
    test_type: 'penetration_test',
    scope: '',
    test_date: new Date().toISOString().split('T')[0],
    tester_organization: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('resilience_tests').insert({
      ...formData,
      conducted_by: userData.user?.id
    });
    
    if (error) {
      toast.error("Error al crear prueba");
    } else {
      toast.success("Prueba programada");
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre de la prueba</label>
        <Input 
          value={formData.test_name}
          onChange={(e) => setFormData({...formData, test_name: e.target.value})}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo</label>
          <select 
            value={formData.test_type} 
            onChange={(e) => setFormData({...formData, test_type: e.target.value})}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="penetration_test">Pentest</option>
            <option value="red_team">Red Team</option>
            <option value="blue_team">Blue Team</option>
            <option value="purple_team">Purple Team</option>
            <option value="vulnerability_scan">Escaneo de vulnerabilidades</option>
            <option value="disaster_recovery">Disaster Recovery</option>
            <option value="business_continuity">Continuidad de negocio</option>
            <option value="tabletop_exercise">Ejercicio tabletop</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha</label>
          <Input 
            type="date"
            value={formData.test_date}
            onChange={(e) => setFormData({...formData, test_date: e.target.value})}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Organización ejecutora</label>
        <Input 
          value={formData.tester_organization}
          onChange={(e) => setFormData({...formData, tester_organization: e.target.value})}
          placeholder="Nombre de la empresa de pentesting"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Alcance</label>
        <Textarea 
          value={formData.scope}
          onChange={(e) => setFormData({...formData, scope: e.target.value})}
          required
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Guardando..." : "Programar Prueba"}
      </Button>
    </form>
  );
}

function ThirdPartyProviderForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    provider_name: '',
    provider_type: 'ict_service',
    criticality: 'standard',
    contact_email: '',
    data_access_level: 'limited'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('third_party_providers').insert({
        provider_name: formData.provider_name,
        provider_type: formData.provider_type,
        criticality: formData.criticality,
        data_access_level: formData.data_access_level,
        contact_email: formData.contact_email || null,
        created_by: userData.user?.id
      });
      
      if (error) {
        console.error('Error creating provider:', error);
        toast.error(`Error al crear proveedor: ${error.message}`);
      } else {
        toast.success("Proveedor registrado");
        onSuccess();
      }
    } catch (err) {
      console.error('Exception creating provider:', err);
      toast.error("Error inesperado al crear proveedor");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre del proveedor</label>
        <Input 
          value={formData.provider_name}
          onChange={(e) => setFormData({...formData, provider_name: e.target.value})}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo</label>
          <select 
            value={formData.provider_type} 
            onChange={(e) => setFormData({...formData, provider_type: e.target.value})}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="cloud_service">Servicio cloud</option>
            <option value="ict_service">Servicio TIC</option>
            <option value="data_processor">Procesador de datos</option>
            <option value="software_vendor">Proveedor software</option>
            <option value="infrastructure">Infraestructura</option>
            <option value="consulting">Consultoría</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Criticidad</label>
          <select 
            value={formData.criticality} 
            onChange={(e) => setFormData({...formData, criticality: e.target.value})}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="critical">Crítico</option>
            <option value="important">Importante</option>
            <option value="standard">Estándar</option>
            <option value="low">Bajo</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nivel de acceso a datos</label>
          <select 
            value={formData.data_access_level} 
            onChange={(e) => setFormData({...formData, data_access_level: e.target.value})}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="full">Completo</option>
            <option value="limited">Limitado</option>
            <option value="none">Ninguno</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email de contacto</label>
          <Input 
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Guardando..." : "Registrar Proveedor"}
      </Button>
    </form>
  );
}

function StressTestForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    simulation_name: '',
    simulation_type: 'availability',
    scenario_description: '',
    target_systems: [] as string[],
    execution_mode: 'manual'
  });
  const [saving, setSaving] = useState(false);

  const systemOptions = [
    'database', 'api', 'backend', 'frontend', 'storage', 
    'network', 'firewall', 'cdn', 'load_balancer', 'microservices'
  ];

  const handleSystemToggle = (system: string) => {
    setFormData(prev => ({
      ...prev,
      target_systems: prev.target_systems.includes(system)
        ? prev.target_systems.filter(s => s !== system)
        : [...prev.target_systems, system]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('stress_test_simulations').insert({
      ...formData,
      created_by: userData.user?.id,
      success_criteria: {
        max_response_time_ms: 500,
        min_success_rate: 99
      }
    });
    
    if (error) {
      toast.error("Error al crear simulación");
      console.error(error);
    } else {
      toast.success("Simulación creada");
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre de la simulación</label>
        <Input 
          value={formData.simulation_name}
          onChange={(e) => setFormData({...formData, simulation_name: e.target.value})}
          placeholder="Ej: Test de carga de base de datos"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de simulación</label>
          <select 
            value={formData.simulation_type} 
            onChange={(e) => setFormData({...formData, simulation_type: e.target.value})}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="availability">Disponibilidad</option>
            <option value="capacity">Capacidad</option>
            <option value="recovery">Recuperación</option>
            <option value="failover">Failover</option>
            <option value="cyber_attack">Ciberataque</option>
            <option value="data_loss">Pérdida de datos</option>
            <option value="network_outage">Interrupción de red</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Modo de ejecución</label>
          <select 
            value={formData.execution_mode} 
            onChange={(e) => setFormData({...formData, execution_mode: e.target.value})}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="manual">Manual</option>
            <option value="scheduled">Programado</option>
            <option value="automated">Automatizado</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción del escenario</label>
        <Textarea 
          value={formData.scenario_description}
          onChange={(e) => setFormData({...formData, scenario_description: e.target.value})}
          placeholder="Describa el escenario de prueba..."
          required
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Sistemas objetivo</label>
        <div className="flex flex-wrap gap-2">
          {systemOptions.map(system => (
            <Badge 
              key={system}
              variant={formData.target_systems.includes(system) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleSystemToggle(system)}
            >
              {system}
            </Badge>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={saving || formData.target_systems.length === 0}>
        {saving ? "Guardando..." : "Crear Simulación"}
      </Button>
    </form>
  );
}

export default DORAComplianceDashboard;
