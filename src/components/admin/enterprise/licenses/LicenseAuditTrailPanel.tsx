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
import { useLicenseAudit, AUDIT_ACTIONS, LicenseAuditLog } from '@/hooks/admin/enterprise/useLicenseAudit';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

export function LicenseAuditTrailPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLog, setSelectedLog] = useState<LicenseAuditLog | null>(null);

  const { 
    logs, 
    loading, 
    totalCount,
    filters,
    setFilters,
    fetchLogs, 
    exportLogs 
  } = useLicenseAudit();

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (actionFilter !== 'all') {
      result = result.filter(log => log.action === actionFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log =>
        log.action.toLowerCase().includes(term) ||
        log.license_id?.toLowerCase().includes(term) ||
        log.actor_id?.toLowerCase().includes(term)
      );
    }

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

  const handleExport = async (exportFormat: 'csv' | 'json') => {
    await exportLogs(exportFormat);
  };

  const getActionLabel = (action: string) => {
    const found = AUDIT_ACTIONS.find(a => a.value === action);
    return found?.label || action;
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
                <p className="text-2xl font-bold">{totalCount}</p>
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
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por licencia, usuario..."
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
                    {getActionLabel(action)}
                  </SelectItem>
                ))}
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
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                            {getActionLabel(log.action)}
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
                        {log.actor_id ? (
                          <span className="text-sm">{log.actor_id.slice(0, 8)}...</span>
                        ) : (
                          <span className="text-muted-foreground">Sistema</span>
                        )}
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
            Mostrando {filteredLogs.length} de {totalCount} eventos
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && ACTION_ICONS[selectedLog.action]}
              {selectedLog && getActionLabel(selectedLog.action)}
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
                {selectedLog.actor_id && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Realizado por</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded block">{selectedLog.actor_id}</code>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LicenseAuditTrailPanel;
