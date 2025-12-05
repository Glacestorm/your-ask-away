import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  FileText, 
  Calendar, 
  Users, 
  Eye, 
  Send, 
  CheckCircle2, 
  Clock,
  RefreshCw,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface KPIStats {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  atRiskGoals: number;
  averageProgress: number;
  byMetricType: Record<string, { count: number; avgProgress: number }>;
  byOffice: Record<string, { count: number; avgProgress: number; completed: number }>;
  topPerformers: Array<{ name: string; avgProgress: number; completed: number }>;
}

interface ReportHistoryItem {
  id: string;
  report_date: string;
  report_type: string;
  stats: KPIStats;
  html_content: string;
  recipients: Array<{ email: string; name: string }>;
  sent_count: number;
  total_recipients: number;
  created_at: string;
}

const metricLabels: Record<string, string> = {
  visits: "Visitas Totales",
  total_visits: "Visitas Totales",
  successful_visits: "Visitas Exitosas",
  new_clients: "Nuevos Clientes",
  visit_sheets: "Fichas de Visita",
  tpv_volume: "Volumen TPV",
  products_per_client: "Productos por Cliente",
  client_facturacion: "Facturación Clientes",
  conversion_rate: "Tasa de Conversión",
  follow_ups: "Seguimientos",
};

export const KPIReportHistory = () => {
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportHistoryItem | null>(null);
  const [sendingReport, setSendingReport] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kpi_report_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Cast the data properly
      const typedData = (data || []).map(item => ({
        ...item,
        stats: item.stats as unknown as KPIStats,
        recipients: item.recipients as unknown as Array<{ email: string; name: string }>
      }));
      
      setReports(typedData);
    } catch (error: any) {
      console.error('Error fetching report history:', error);
      toast.error('Error al cargar el historial de informes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSendManualReport = async () => {
    setSendingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-weekly-kpi-report', {
        body: {}
      });

      if (error) throw error;

      toast.success(`Informe enviado a ${data.sent}/${data.total} directores`);
      fetchReports();
    } catch (error: any) {
      console.error('Error sending manual report:', error);
      toast.error('Error al enviar el informe: ' + error.message);
    } finally {
      setSendingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historial de Informes KPI</h1>
          <p className="text-muted-foreground">Consulta y reenvía informes anteriores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReports} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={handleSendManualReport} disabled={sendingReport}>
            {sendingReport ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Informe Ahora
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-sm text-muted-foreground">Informes Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reports.reduce((acc, r) => acc + r.sent_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Emails Entregados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reports.length > 0 ? reports[0].total_recipients : 0}
                </p>
                <p className="text-sm text-muted-foreground">Directores Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay informes</h3>
            <p className="text-muted-foreground mb-4">
              Aún no se han generado informes KPI. Haz clic en "Enviar Informe Ahora" para generar el primero.
            </p>
            <Button onClick={handleSendManualReport} disabled={sendingReport}>
              <Send className="h-4 w-4 mr-2" />
              Generar Primer Informe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          Informe {report.report_type === 'weekly' ? 'Semanal' : report.report_type}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {report.stats.totalGoals} objetivos
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(report.created_at), "PPP 'a las' HH:mm", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {report.sent_count}/{report.total_recipients} enviados
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {report.stats.completedGoals} completados
                        </Badge>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />
                          {report.stats.inProgressGoals} en progreso
                        </Badge>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {report.stats.atRiskGoals} en riesgo
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Informe
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Informe del {format(new Date(report.report_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                          </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[70vh]">
                          <div dangerouslySetInnerHTML={{ __html: report.html_content }} />
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
