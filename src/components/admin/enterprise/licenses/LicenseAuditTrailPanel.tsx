/**
 * License Audit Trail Panel
 * Panel completo de auditoría de licencias
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  History,
  Search,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Key,
  Monitor,
  UserCheck,
  Shield,
  AlertTriangle,
  Clock,
  FileText,
  ArrowUpDown
} from 'lucide-react';
import { useLicenseAudit, LicenseAuditLog } from '@/hooks/admin/enterprise';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'license.created': <Key className="h-4 w-4 text-green-500" />,
  'license.activated': <UserCheck className="h-4 w-4 text-blue-500" />,
  'license.deactivated': <Shield className="h-4 w-4 text-orange-500" />,
  'license.expired': <Clock className="h-4 w-4 text-red-500" />,
  'license.renewed': <RefreshCw className="h-4 w-4 text-emerald-500" />,
  'license.transferred': <ArrowUpDown className="h-4 w-4 text-purple-500" />,
  'device.activated': <Monitor className="h-4 w-4 text-blue-500" />,
  'device.deactivated': <Monitor className="h-4 w-4 text-gray-500" />,
  'anomaly.detected': <AlertTriangle className="h-4 w-4 text-amber-500" />,
  'settings.changed': <FileText className="h-4 w-4 text-muted-foreground" />,
};

const ACTION_LABELS: Record<string, string> = {
  'license.created': 'Licencia Creada',
  'license.activated': 'Licencia Activada',
  'license.deactivated': 'Licencia Desactivada',
  'license.expired': 'Licencia Expirada',
  'license.renewed': 'Licencia Renovada',
  'license.transferred': 'Licencia Transferida',
  'device.activated': 'Dispositivo Activado',
  'device.deactivated': 'Dispositivo Desactivado',
  'anomaly.detected': 'Anomalía Detectada',
  'settings.changed': 'Configuración Modificada',
};

export function LicenseAuditTrailPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedLog, setSelectedLog] = useState<LicenseAuditLog | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { logs, loading, stats, fetchLogs, exportLogs } = useLicenseAudit();

  useEffect(() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 7;
    const startDate = subDays(new Date(), days);
    fetchLogs({ startDate: startDate.toISOString() });
  }, [dateRange, fetchLogs]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter by action
    if (actionFilter !== 'all') {
      result = result.filter(log => log.action === actionFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log =>
        log.action.toLowerCase().includes(term) ||
        log.license_id?.toLowerCase().includes(term) ||
        log.performed_by?.toLowerCase().includes(term) ||
        log.ip_address?.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [logs, actionFilter, searchTerm, sortOrder]);

  const uniqueActions = useMemo(() => {
    return [...new Set(logs.map(log => log.action))];
  }, [logs]);

  const handleExport = async () => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const startDate = subDays(new Date(), days);
    await exportLogs(startDate.toISOString());
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medio</Badge>;
      case 'low':
        return <Badge variant="secondary">Bajo</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Eventos</p>
                <p className="text-2xl font-bold">{stats?.totalEvents || logs.length}</p>
              </div>
              <History className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activaciones</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action.includes('activated')).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomalías</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action === 'anomaly.detected').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transferencias</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action === 'license.transferred').length}
                </p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Trail de Auditoría
              </CardTitle>
              <CardDescription>
                Historial completo de todas las acciones en el sistema de licencias
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por licencia, usuario, IP..."
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo de acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {ACTION_LABELS[action] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              title={sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acción</TableHead>
                  <TableHead>Licencia</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Cargando eventos...' : 'No hay eventos que coincidan con los filtros'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ACTION_ICONS[log.action] || <FileText className="h-4 w-4" />}
                          <span className="font-medium text-sm">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.license_id ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.license_id.slice(0, 8)}...
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.performed_by ? (
                          <span className="text-sm">{log.performed_by.slice(0, 8)}...</span>
                        ) : (
                          <span className="text-muted-foreground">Sistema</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.ip_address ? (
                          <code className="text-xs">{log.ip_address}</code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(log.severity)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="mt-4 text-sm text-muted-foreground text-center">
            Mostrando {filteredLogs.length} de {logs.length} eventos
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && ACTION_ICONS[selectedLog.action]}
              {selectedLog && (ACTION_LABELS[selectedLog.action] || selectedLog.action)}
            </DialogTitle>
            <DialogDescription>
              Detalles completos del evento de auditoría
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ID del Evento</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded block">{selectedLog.id}</code>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedLog.created_at), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm:ss", { locale: es })}
                  </p>
                </div>
                {selectedLog.license_id && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID de Licencia</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded block">{selectedLog.license_id}</code>
                  </div>
                )}
                {selectedLog.device_id && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID de Dispositivo</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded block">{selectedLog.device_id}</code>
                  </div>
                )}
                {selectedLog.performed_by && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Realizado por</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded block">{selectedLog.performed_by}</code>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Dirección IP</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded block">{selectedLog.ip_address}</code>
                  </div>
                )}
              </div>

              {selectedLog.old_values && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Valores Anteriores</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Valores Nuevos</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Metadatos Adicionales</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LicenseAuditTrailPanel;
