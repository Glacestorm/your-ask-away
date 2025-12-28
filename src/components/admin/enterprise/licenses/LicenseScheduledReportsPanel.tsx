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
  CheckCircle2,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { useLicenseScheduledReports, ScheduledReport, ReportHistory } from '@/hooks/admin/enterprise/useLicenseScheduledReports';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const REPORT_TYPES = [
  { value: 'usage', label: 'Uso de Licencias' },
  { value: 'expiration', label: 'Próximas Expiraciones' },
  { value: 'revenue', label: 'Ingresos' },
  { value: 'anomalies', label: 'Anomalías' },
  { value: 'devices', label: 'Dispositivos' },
  { value: 'summary', label: 'Resumen Ejecutivo' },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
];

const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
];

export function LicenseScheduledReportsPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    report_type: 'summary',
    frequency: 'weekly',
    format: 'pdf',
    recipients: ''
  });

  const {
    reports,
    history,
    loading,
    fetchReports,
    fetchHistory,
    createReport,
    updateReport,
    deleteReport,
    runNow
  } = useLicenseScheduledReports();

  useEffect(() => {
    fetchReports();
    fetchHistory();
  }, []);

  const handleCreateReport = async () => {
    if (!formData.name || !formData.recipients) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    const recipients = formData.recipients.split(',').map(e => e.trim()).filter(e => e);
    
    const success = await createReport({
      name: formData.name,
      report_type: formData.report_type,
      frequency: formData.frequency,
      format: formData.format,
      recipients
    });

    if (success) {
      setIsCreateOpen(false);
      setFormData({
        name: '',
        report_type: 'summary',
        frequency: 'weekly',
        format: 'pdf',
        recipients: ''
      });
    }
  };

  const handleToggle = async (report: ScheduledReport) => {
    await updateReport(report.id, { is_active: !report.is_active });
  };

  const handleDelete = async (reportId: string) => {
    if (confirm('¿Está seguro de eliminar este reporte programado?')) {
      await deleteReport(reportId);
    }
  };

  const handleRunNow = async (reportId: string) => {
    await runNow(reportId);
  };

  const getFrequencyLabel = (freq: string) => {
    return FREQUENCIES.find(f => f.value === freq)?.label || freq;
  };

  const getReportTypeLabel = (type: string) => {
    return REPORT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Fallido</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Procesando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeReports = reports.filter(r => r.is_active);
  const todayHistory = history.filter(h => 
    new Date(h.generated_at).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reportes Activos</p>
                <p className="text-2xl font-bold">{activeReports.length}</p>
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
                <p className="text-2xl font-bold">{todayHistory.length}</p>
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
                  {history.filter(h => h.status === 'completed').length}
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
                <p className="text-sm text-muted-foreground">Total Reportes</p>
                <p className="text-2xl font-bold">{reports.length}</p>
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
              <Button variant="outline" size="sm" onClick={() => { fetchReports(); fetchHistory(); }}>
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
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                  <TableHead>Formato</TableHead>
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
                  reports.map(report => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{report.name}</p>
                            <p className="text-xs text-muted-foreground">{getReportTypeLabel(report.report_type)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getFrequencyLabel(report.frequency)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {report.format}
                        </Badge>
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
                  ))
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
                  <TableHead>Estado</TableHead>
                  <TableHead>Generado</TableHead>
                  <TableHead className="text-right">Descargar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay reportes generados
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-medium">
                          {reports.find(r => r.id === item.report_id)?.name || 'Reporte'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {item.format}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(item.generated_at), { addSuffix: true, locale: es })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.file_url && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={item.file_url} target="_blank" rel="noopener noreferrer">
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
