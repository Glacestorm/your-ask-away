import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, MessageSquare, Database, Send, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuditorQuestionnaireEditor } from './AuditorQuestionnaireEditor';
import { EvidenceCollector } from './EvidenceCollector';
import { AuditReportPreview } from './AuditReportPreview';
import { AuditCalendar } from './AuditCalendar';

export function AuditReportingDashboard() {
  const [activeTab, setActiveTab] = useState('scheduled');
  const [selectedSector, setSelectedSector] = useState<string>('banking');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['auditor-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auditor_report_templates')
        .select('*')
        .eq('is_active', true)
        .order('sector_key');
      if (error) throw error;
      return data;
    },
  });

  const { data: recentReports, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['audit-reports-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_reports_generated')
        .select('*, template:auditor_report_templates(*)')
        .order('generated_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: questionsStats } = useQuery({
    queryKey: ['auditor-questions-stats', selectedSector],
    queryFn: async () => {
      const { data: questions, error } = await supabase
        .from('auditor_questions')
        .select('id, priority')
        .eq('sector_key', selectedSector)
        .eq('is_active', true);
      if (error) throw error;

      const { data: responses } = await supabase
        .from('auditor_responses')
        .select('question_id, status')
        .in('question_id', questions?.map(q => q.id) || []);

      return {
        total: questions?.length || 0,
        critical: questions?.filter(q => q.priority === 'critical').length || 0,
        answered: responses?.filter(r => r.status === 'approved' || r.status === 'submitted').length || 0,
        draft: responses?.filter(r => r.status === 'draft').length || 0,
      };
    },
  });

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const today = new Date();
      const periodEnd = today.toISOString().split('T')[0];
      const periodStart = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('generate-audit-report', {
        body: {
          sectorKey: selectedSector,
          reportType: 'monthly',
          periodStart,
          periodEnd,
        },
      });

      if (error) throw error;

      toast.success('Informe generado correctamente', {
        description: `Score de cumplimiento: ${data.report.compliance_score}/100`,
      });
      refetchReports();
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error('Error al generar informe', { description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const sectorOptions = [
    { value: 'banking', label: 'Banca', icon: '🏦' },
    { value: 'health', label: 'Salud', icon: '🏥' },
    { value: 'industry', label: 'Industria', icon: '🏭' },
    { value: 'retail', label: 'Retail', icon: '🛒' },
    { value: 'technology', label: 'Tecnología', icon: '💻' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reporting para Auditores</h2>
          <p className="text-muted-foreground">
            Genera informes de auditoría por sector con respuestas automáticas y evidencias
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {sectorOptions.map((sector) => (
              <option key={sector.value} value={sector.value}>
                {sector.icon} {sector.label}
              </option>
            ))}
          </select>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generar Informe
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Preguntas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questionsStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {questionsStats?.critical || 0} críticas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Respondidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{questionsStats?.answered || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aprobadas/Enviadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Borrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{questionsStats?.draft || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pendientes revisión
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Informes Generados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentReports?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Programados
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Preguntas
          </TabsTrigger>
          <TabsTrigger value="evidence" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Evidencias
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informes Programados</CardTitle>
              <CardDescription>
                Próximos informes automáticos según plantillas configuradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates?.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{template.template_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {template.regulation_code} · Sector: {template.sector_key}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{template.frequency}</Badge>
                      <Badge>{(template.sections as any[])?.length || 0} secciones</Badge>
                    </div>
                  </div>
                ))}
                {(!templates || templates.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay plantillas configuradas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          <AuditorQuestionnaireEditor sectorKey={selectedSector} />
        </TabsContent>

        <TabsContent value="evidence" className="mt-6">
          <EvidenceCollector sectorKey={selectedSector} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Informes</CardTitle>
              <CardDescription>
                Informes generados anteriormente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports?.map((report) => (
                  <AuditReportPreview key={report.id} report={report} onRefresh={refetchReports} />
                ))}
                {(!recentReports || recentReports.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay informes generados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <AuditCalendar templates={templates || []} reports={recentReports || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
