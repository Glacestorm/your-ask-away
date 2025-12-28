/**
 * License Scheduled Reports Panel
 * Gestión de reportes programados de licencias
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Plus,
  RefreshCw,
  Calendar,
  Clock,
  Mail,
  Download,
  Trash2,
  Play,
  Pause,
  Eye,
  CheckCircle2,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { useLicenseScheduledReports, LicenseScheduledReport, LicenseReportHistory } from '@/hooks/admin/enterprise';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const REPORT_TYPES = [
  { value: 'usage', label: 'Uso de Licencias', description: 'Estadísticas de uso y activaciones' },
  { value: 'expiration', label: 'Próximas Expiraciones', description: 'Licencias que expirarán pronto' },
  { value: 'revenue', label: 'Ingresos', description: 'Análisis de ingresos por licencias' },
  { value: 'anomalies', label: 'Anomalías', description: 'Detección de uso irregular' },
  { value: 'devices', label: 'Dispositivos', description: 'Estado de dispositivos activos' },
  { value: 'summary', label: 'Resumen Ejecutivo', description: 'Visión general del sistema' },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
];

const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
];

export function LicenseScheduledReportsPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<LicenseScheduledReport | null>(null);
  const [formData, setFormData] = useState({
    report_name: '',
    report_type: 'summary',
    frequency: 'weekly',
    format: 'pdf',
    recipients: '',
    next_run: '',
    include_charts: true,
    include_details: true
  });

  const {
    reports,
    reportHistory,
    loading,
    fetchReports,
    fetchReportHistory,
    createReport,
    updateReport,
    deleteReport,
    runReportNow
  } = useLicenseScheduledReports();

  useEffect(() => {
    fetchReports();
    fetchReportHistory();
  }, [fetchReports, fetchReportHistory]);

  const handleCreateReport = async () => {
    if (!formData.report_name || !formData.recipients) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    const success = await createReport({
      report_name: formData.report_name,
      report_type: formData.report_type,
      frequency: formData.frequency,
      format: formData.format,
      recipients: formData.recipients.split(',').map(e => e.trim()),
      next_run_at: formData.next_run || new Date().toISOString(),
      parameters: {
        include_charts: formData.include_charts,
        include_details: formData.include_details
      }
    });

    if (success) {
      setIsCreateOpen(false);
      setFormData({
        report_name: '',
        report_type: 'summary',
        frequency: 'weekly',
        format: 'pdf',
        recipients: '',
        next_run: '',
        include_charts: true,
        include_details: true
      });
    }
  };

  const handleToggle = async (report: LicenseScheduledReport) => {
    await updateReport(report.id, { is_active: !report.is_active });
  };

  const handleDelete = async (reportId: string) => {
    if (confirm('¿Está seguro de eliminar este reporte programado?')) {
      await deleteReport(reportId);
    }
  };

  const handleRunNow = async (reportId: string) => {
    await runReportNow(reportId);
  };

  const getFrequencyLabel = (freq: string) => {
    return FREQUENCIES.find(f => f.value === freq)?.label || freq;
  };

  const getReportTypeInfo = (type: string) => {
    return REPORT_TYPES.find(t => t.value === type) || { value: type, label: type, description: '' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Fallido</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Procesando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reportes Activos</p>
                <p className="text-2xl font-bold">{reports.filter(r => r.is_active).length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Generados Hoy</p>
                <p className="text-2xl font-bold">
                  {reportHistory.filter(h => 
                    new Date(h.generated_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emails Enviados</p>
                <p className="text-2xl font-bold">
                  {reportHistory.filter(h => h.sent_to && h.sent_to.length > 0).length}
                </p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próxima Ejecución</p>
                <p className="text-lg font-bold">
                  {reports.length > 0 && reports.some(r => r.is_active && r.next_run_at)
                    ? formatDistanceToNow(
                        new Date(
                          Math.min(
                            ...reports
                              .filter(r => r.is_active && r.next_run_at)
                              .map(r => new Date(r.next_run_at!).getTime())
                          )
                        ),
                        { addSuffix: true, locale: es }
                      )
                    : 'N/A'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Reportes Programados
              </CardTitle>
              <CardDescription>
                Configure reportes automáticos que se envían periódicamente
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { fetchReports(); fetchReportHistory(); }}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Reporte
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Crear Reporte Programado</DialogTitle>
                    <DialogDescription>
                      Configure un nuevo reporte que se generará automáticamente
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Reporte *</Label>
                      <Input
                        id="name"
                        placeholder="Ej: Reporte Semanal de Uso"
                        value={formData.report_name}
                        onChange={e => setFormData({ ...formData, report_name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Reporte</Label>
                        <Select
                          value={formData.report_type}
                          onValueChange={v => setFormData({ ...formData, report_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REPORT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Frecuencia</Label>
                        <Select
                          value={formData.frequency}
                          onValueChange={v => setFormData({ ...formData, frequency: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCIES.map(freq => (
                              <SelectItem key={freq.value} value={freq.value}>
                                {freq.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Formato</Label>
                        <Select
                          value={formData.format}
                          onValueChange={v => setFormData({ ...formData, format: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FORMATS.map(fmt => (
                              <SelectItem key={fmt.value} value={fmt.value}>
                                {fmt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="next">Primera Ejecución</Label>
                        <Input
                          id="next"
                          type="datetime-local"
                          value={formData.next_run}
                          onChange={e => setFormData({ ...formData, next_run: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipients">Destinatarios *</Label>
                      <Input
                        id="recipients"
                        placeholder="email1@ejemplo.com, email2@ejemplo.com"
                        value={formData.recipients}
                        onChange={e => setFormData({ ...formData, recipients: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separe múltiples emails con comas
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="charts"
                            checked={formData.include_charts}
                            onCheckedChange={v => setFormData({ ...formData, include_charts: v })}
                          />
                          <Label htmlFor="charts" className="text-sm">Incluir gráficos</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="details"
                            checked={formData.include_details}
                            onCheckedChange={v => setFormData({ ...formData, include_details: v })}
                          />
                          <Label htmlFor="details" className="text-sm">Incluir detalles</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateReport}>
                      Crear Reporte
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporte</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Próxima Ejecución</TableHead>
                  <TableHead>Destinatarios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay reportes programados
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map(report => {
                    const typeInfo = getReportTypeInfo(report.report_type);
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{report.report_name}</p>
                              <p className="text-xs text-muted-foreground">{typeInfo.label}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getFrequencyLabel(report.frequency)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {report.next_run_at ? (
                            <div className="text-sm">
                              <p>{format(new Date(report.next_run_at), 'dd/MM/yy HH:mm')}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(report.next_run_at), { addSuffix: true, locale: es })}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{report.recipients.length}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={report.is_active}
                            onCheckedChange={() => handleToggle(report)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRunNow(report.id)}
                              title="Ejecutar ahora"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(report.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Reportes Generados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[250px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporte</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Enviado a</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Generado</TableHead>
                  <TableHead className="text-right">Descargar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay reportes generados
                    </TableCell>
                  </TableRow>
                ) : (
                  reportHistory.map(history => (
                    <TableRow key={history.id}>
                      <TableCell>
                        <span className="font-medium">
                          {reports.find(r => r.id === history.report_id)?.report_name || 'Reporte'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {history.format}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {history.file_size ? `${(history.file_size / 1024).toFixed(1)} KB` : '-'}
                      </TableCell>
                      <TableCell>
                        {history.sent_to && history.sent_to.length > 0 ? (
                          <span className="text-sm">{history.sent_to.length} emails</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(history.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(history.generated_at), { addSuffix: true, locale: es })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {history.file_url && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={history.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default LicenseScheduledReportsPanel;
