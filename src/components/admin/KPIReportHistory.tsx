import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeHtml } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Mail,
  CalendarDays,
  CalendarRange,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportHistoryItem {
  id: string;
  report_date: string;
  report_type: string;
  stats: any;
  html_content: string;
  recipients: Array<{ email: string; name: string }>;
  sent_count: number;
  total_recipients: number;
  created_at: string;
}

const reportTypeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  daily: { label: 'Diario', icon: CalendarDays, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  weekly: { label: 'Semanal', icon: CalendarRange, color: 'text-green-600', bgColor: 'bg-green-100' },
  monthly: { label: 'Mensual', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' },
};

export const KPIReportHistory = () => {
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [sendingReport, setSendingReport] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('kpi_report_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterType !== 'all') {
        query = query.eq('report_type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        stats: item.stats as any,
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
  }, [filterType]);

  const handleSendReport = async (type: string) => {
    setSendingReport(type);
    try {
      const functionName = type === 'daily' 
        ? 'send-daily-kpi-report' 
        : type === 'monthly' 
          ? 'send-monthly-kpi-report' 
          : 'send-weekly-kpi-report';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {}
      });

      if (error) throw error;

      toast.success(`Informe ${reportTypeConfig[type]?.label || type} enviado a ${data.sent}/${data.total} destinatarios`);
      fetchReports();
    } catch (error: any) {
      console.error('Error sending report:', error);
      toast.error('Error al enviar el informe: ' + error.message);
    } finally {
      setSendingReport(null);
    }
  };

  const filteredReports = reports;
  const reportCounts = {
    daily: reports.filter(r => r.report_type === 'daily').length,
    weekly: reports.filter(r => r.report_type === 'weekly').length,
    monthly: reports.filter(r => r.report_type === 'monthly').length,
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historial de Informes KPI</h1>
          <p className="text-muted-foreground">Consulta y genera informes diarios, semanales y mensuales</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchReports} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Send Report Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(reportTypeConfig).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <Card key={type} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{config.label}</p>
                      <p className="text-sm text-muted-foreground">{reportCounts[type as keyof typeof reportCounts]} enviados</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleSendReport(type)}
                    disabled={sendingReport !== null}
                  >
                    {sendingReport === type ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-sm text-muted-foreground">Total Informes</p>
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

      {/* Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Filtrar por tipo:</span>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="daily">Diarios</SelectItem>
            <SelectItem value="weekly">Semanales</SelectItem>
            <SelectItem value="monthly">Mensuales</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay informes</h3>
            <p className="text-muted-foreground mb-4">
              Selecciona un tipo de informe arriba para generar el primero.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => {
            const typeConfig = reportTypeConfig[report.report_type] || reportTypeConfig.weekly;
            const TypeIcon = typeConfig.icon;
            
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${typeConfig.bgColor}`}>
                        <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            Informe {typeConfig.label}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {typeConfig.label}
                          </Badge>
                          {report.stats?.totalGoals !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {report.stats.totalGoals} objetivos
                            </Badge>
                          )}
                          {report.stats?.totalVisits !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {report.stats.totalVisits} visitas
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
                          {report.stats?.completedGoals !== undefined && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {report.stats.completedGoals} completados
                            </Badge>
                          )}
                          {report.stats?.inProgressGoals !== undefined && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Clock className="h-3 w-3 mr-1" />
                              {report.stats.inProgressGoals} en progreso
                            </Badge>
                          )}
                          {report.stats?.newVisits !== undefined && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {report.stats.newVisits} visitas
                            </Badge>
                          )}
                          {report.stats?.visitSuccessRate !== undefined && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {report.stats.visitSuccessRate.toFixed(0)}% éxito
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Informe
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                              Informe {typeConfig.label} del {format(new Date(report.report_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[70vh]">
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(report.html_content || '') }} />
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
