/**
 * Visor de Auditoría ERP
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useERPAudit } from '@/hooks/erp/useERPAudit';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { ERPAuditEvent, ERPAuditFilters } from '@/types/erp';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ENTITY_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'erp_companies', label: 'Empresas' },
  { value: 'erp_fiscal_years', label: 'Ejercicios' },
  { value: 'erp_periods', label: 'Periodos' },
  { value: 'erp_series', label: 'Series' },
  { value: 'erp_roles', label: 'Roles' },
];

const ACTIONS = [
  { value: '', label: 'Todas' },
  { value: 'INSERT', label: 'Creación' },
  { value: 'UPDATE', label: 'Modificación' },
  { value: 'DELETE', label: 'Eliminación' },
  { value: 'CLOSE_PERIOD', label: 'Cierre Periodo' },
  { value: 'CLOSE_FISCAL_YEAR', label: 'Cierre Ejercicio' },
];

export function ERPAuditViewer() {
  const { currentCompany, hasPermission } = useERPContext();
  const { events, isLoading, fetchEvents, exportEvents } = useERPAudit();
  
  const [filters, setFilters] = useState<ERPAuditFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ERPAuditEvent | null>(null);

  const canView = hasPermission('admin.all');

  useEffect(() => {
    if (currentCompany?.id && canView) {
      fetchEvents(currentCompany.id, filters);
    }
  }, [currentCompany?.id, canView, fetchEvents]);

  const handleSearch = () => {
    if (currentCompany?.id) {
      fetchEvents(currentCompany.id, filters);
    }
  };

  const handleExport = async () => {
    if (currentCompany?.id) {
      const csv = await exportEvents(currentCompany.id, filters);
      if (csv) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <Pencil className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      INSERT: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
    };
    return <Badge variant={variants[action] || 'outline'}>{action}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss", { locale: es });
  };

  const getEntityLabel = (entityType: string) => {
    return ENTITY_TYPES.find(e => e.value === entityType)?.label || entityType;
  };

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No tienes permisos para ver la auditoría
        </CardContent>
      </Card>
    );
  }

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona una empresa para ver la auditoría
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Auditoría
            </CardTitle>
            <CardDescription>
              Registro de cambios y acciones del sistema
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        {showFilters && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Entidad</Label>
                <Select 
                  value={filters.entity_type || ''} 
                  onValueChange={(v) => setFilters({ ...filters, entity_type: v || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Acción</Label>
                <Select 
                  value={filters.action || ''} 
                  onValueChange={(v) => setFilters({ ...filters, action: v || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFilters({})}>
                Limpiar
              </Button>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        )}

        {/* Tabla */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay eventos de auditoría
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm">
                      {formatDate(event.created_at)}
                    </TableCell>
                    <TableCell>{event.actor_name || 'Sistema'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(event.action)}
                        <span>{getEntityLabel(event.entity_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(event.action)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {event.ip_address || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog Detalle */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Detalle de Auditoría
              </DialogTitle>
            </DialogHeader>
            
            {selectedEvent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fecha</Label>
                    <p className="font-medium">{formatDate(selectedEvent.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Usuario</Label>
                    <p className="font-medium">{selectedEvent.actor_name || 'Sistema'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Entidad</Label>
                    <p className="font-medium">{getEntityLabel(selectedEvent.entity_type)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Acción</Label>
                    <p>{getActionBadge(selectedEvent.action)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ID Entidad</Label>
                    <p className="font-mono text-sm">{selectedEvent.entity_id || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">IP</Label>
                    <p className="font-mono text-sm">{selectedEvent.ip_address || '-'}</p>
                  </div>
                </div>

                {(selectedEvent.before_json || selectedEvent.after_json) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEvent.before_json && (
                      <div>
                        <Label className="text-muted-foreground mb-2 block">Antes</Label>
                        <ScrollArea className="h-[300px] rounded-lg border bg-muted/30 p-3">
                          <pre className="text-xs font-mono whitespace-pre-wrap">
                            {JSON.stringify(selectedEvent.before_json, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                    {selectedEvent.after_json && (
                      <div>
                        <Label className="text-muted-foreground mb-2 block">Después</Label>
                        <ScrollArea className="h-[300px] rounded-lg border bg-muted/30 p-3">
                          <pre className="text-xs font-mono whitespace-pre-wrap">
                            {JSON.stringify(selectedEvent.after_json, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                )}

                {selectedEvent.user_agent && (
                  <div>
                    <Label className="text-muted-foreground">User Agent</Label>
                    <p className="text-xs text-muted-foreground truncate">{selectedEvent.user_agent}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ERPAuditViewer;
