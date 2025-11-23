import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AuditLog } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Filter, Activity, Eye, Edit, Plus, Trash2, Clock, FileDown, FileSpreadsheet } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ActivityFilters {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  actionType: string;
  tableName: string;
}

export function PersonalActivityHistory() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ActivityFilters>({
    dateFrom: undefined,
    dateTo: undefined,
    actionType: 'all',
    tableName: 'all',
  });

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user, filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }
      if (filters.actionType !== 'all') {
        query = query.eq('action', filters.actionType);
      }
      if (filters.tableName !== 'all') {
        query = query.eq('table_name', filters.tableName);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toUpperCase()) {
      case 'INSERT':
        return <Plus className="h-4 w-4" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4" />;
      case 'SELECT':
        return <Eye className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'INSERT':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'SELECT':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTableDisplayName = (tableName: string) => {
    const tableNames: Record<string, string> = {
      companies: 'Empresas',
      visits: 'Visitas',
      company_contacts: 'Contactos',
      company_documents: 'Documentos',
      company_photos: 'Fotos',
      profiles: 'Perfil',
      company_products: 'Productos de Empresa',
      notification_preferences: 'Preferencias de Notificación',
      visit_reminder_preferences: 'Preferencias de Recordatorios',
    };
    return tableNames[tableName] || tableName;
  };

  const renderChanges = (activity: AuditLog) => {
    if (activity.action === 'DELETE' && activity.old_data) {
      return (
        <div className="mt-2 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Registro eliminado:</p>
          <div className="rounded-md bg-muted/50 p-2 text-xs">
            {Object.entries(activity.old_data as Record<string, any>).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium">{key}:</span>
                <span className="text-muted-foreground">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activity.action === 'INSERT' && activity.new_data) {
      return (
        <div className="mt-2 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Registro creado:</p>
          <div className="rounded-md bg-muted/50 p-2 text-xs">
            {Object.entries(activity.new_data as Record<string, any>).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium">{key}:</span>
                <span className="text-muted-foreground">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activity.action === 'UPDATE' && activity.old_data && activity.new_data) {
      const oldData = activity.old_data as Record<string, any>;
      const newData = activity.new_data as Record<string, any>;
      const changes: Array<{ key: string; old: any; new: any }> = [];

      Object.keys(newData).forEach((key) => {
        if (oldData[key] !== newData[key] && key !== 'updated_at') {
          changes.push({ key, old: oldData[key], new: newData[key] });
        }
      });

      if (changes.length === 0) return null;

      return (
        <div className="mt-2 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Cambios realizados:</p>
          {changes.slice(0, 4).map((change) => (
            <div key={change.key} className="rounded-md bg-muted/50 p-2 text-xs">
              <div className="font-medium mb-1">{change.key}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="text-muted-foreground line-through">{String(change.old)}</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex-1">
                  <span className="text-foreground font-medium">{String(change.new)}</span>
                </div>
              </div>
            </div>
          ))}
          {changes.length > 4 && (
            <p className="text-xs text-muted-foreground italic">
              +{changes.length - 4} cambios más
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  const getFilterSummary = () => {
    const parts: string[] = [];
    if (filters.dateFrom) parts.push(`Desde: ${format(filters.dateFrom, 'dd/MM/yyyy')}`);
    if (filters.dateTo) parts.push(`Hasta: ${format(filters.dateTo, 'dd/MM/yyyy')}`);
    if (filters.actionType !== 'all') parts.push(`Acción: ${filters.actionType}`);
    if (filters.tableName !== 'all') parts.push(`Tabla: ${getTableDisplayName(filters.tableName)}`);
    return parts.length > 0 ? parts.join(' | ') : 'Sin filtros aplicados';
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text('Historial de Actividad Personal', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 28);
      doc.text(`Usuario: ${user?.email || 'N/A'}`, 14, 34);
      doc.text(`Filtros: ${getFilterSummary()}`, 14, 40);
      
      // Table data
      const tableData = activities.map((activity) => {
        let details = '';
        if (activity.action === 'UPDATE' && activity.old_data && activity.new_data) {
          const oldData = activity.old_data as Record<string, any>;
          const newData = activity.new_data as Record<string, any>;
          const changes = Object.keys(newData)
            .filter(key => oldData[key] !== newData[key] && key !== 'updated_at')
            .map(key => `${key}: ${oldData[key]} → ${newData[key]}`)
            .join('; ');
          details = changes || 'Sin cambios';
        } else if (activity.action === 'INSERT' && activity.new_data) {
          const data = activity.new_data as Record<string, any>;
          details = Object.entries(data).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join('; ');
        } else if (activity.action === 'DELETE' && activity.old_data) {
          const data = activity.old_data as Record<string, any>;
          details = Object.entries(data).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join('; ');
        }
        
        return [
          format(new Date(activity.created_at!), 'dd/MM/yyyy HH:mm'),
          activity.action,
          getTableDisplayName(activity.table_name),
          details.substring(0, 100) + (details.length > 100 ? '...' : '')
        ];
      });

      autoTable(doc, {
        startY: 48,
        head: [['Fecha', 'Acción', 'Tabla', 'Detalles']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save(`historial-actividad-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF exportado correctamente');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al exportar PDF');
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = activities.map((activity) => {
        let details = '';
        if (activity.action === 'UPDATE' && activity.old_data && activity.new_data) {
          const oldData = activity.old_data as Record<string, any>;
          const newData = activity.new_data as Record<string, any>;
          const changes = Object.keys(newData)
            .filter(key => oldData[key] !== newData[key] && key !== 'updated_at')
            .map(key => `${key}: ${oldData[key]} → ${newData[key]}`)
            .join('; ');
          details = changes || 'Sin cambios';
        } else if (activity.action === 'INSERT' && activity.new_data) {
          const data = activity.new_data as Record<string, any>;
          details = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('; ');
        } else if (activity.action === 'DELETE' && activity.old_data) {
          const data = activity.old_data as Record<string, any>;
          details = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('; ');
        }

        return {
          'Fecha': format(new Date(activity.created_at!), 'dd/MM/yyyy HH:mm'),
          'Acción': activity.action,
          'Tabla': getTableDisplayName(activity.table_name),
          'Detalles': details,
          'ID Registro': activity.record_id || 'N/A'
        };
      });

      // Add header info
      const headerInfo = [
        { 'Historial de Actividad Personal': '' },
        { 'Generado': format(new Date(), 'dd/MM/yyyy HH:mm') },
        { 'Usuario': user?.email || 'N/A' },
        { 'Filtros': getFilterSummary() },
        {},
      ];

      const ws = XLSX.utils.json_to_sheet([...headerInfo, ...exportData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Historial');
      
      XLSX.writeFile(wb, `historial-actividad-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Excel exportado correctamente');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Error al exportar Excel');
    }
  };

  const uniqueTables = Array.from(new Set(activities.map((a) => a.table_name)));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Mi Historial de Actividad
            </CardTitle>
            <CardDescription>
              Registro de todas tus acciones en el sistema
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              disabled={activities.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              disabled={activities.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(filters.dateFrom, 'PPP', { locale: es }) : 'Fecha desde'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => setFilters({ ...filters, dateFrom: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(filters.dateTo, 'PPP', { locale: es }) : 'Fecha hasta'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => setFilters({ ...filters, dateTo: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={filters.actionType} onValueChange={(value) => setFilters({ ...filters, actionType: value })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo de acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              <SelectItem value="INSERT">Crear</SelectItem>
              <SelectItem value="UPDATE">Actualizar</SelectItem>
              <SelectItem value="DELETE">Eliminar</SelectItem>
              <SelectItem value="SELECT">Ver</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.tableName} onValueChange={(value) => setFilters({ ...filters, tableName: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tabla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las tablas</SelectItem>
              {uniqueTables.map((table) => (
                <SelectItem key={table} value={table}>
                  {getTableDisplayName(table)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filters.dateFrom || filters.dateTo || filters.actionType !== 'all' || filters.tableName !== 'all') && (
            <Button
              variant="ghost"
              onClick={() => setFilters({ dateFrom: undefined, dateTo: undefined, actionType: 'all', tableName: 'all' })}
            >
              <Filter className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No se encontraron actividades
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajusta los filtros para ver más resultados
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="relative space-y-4">
              {/* Timeline line */}
              <div className="absolute left-[21px] top-2 bottom-2 w-px bg-border" />

              {activities.map((activity, index) => (
                <div key={activity.id} className="relative pl-12">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute left-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border-2',
                      getActionColor(activity.action)
                    )}
                  >
                    {getActionIcon(activity.action)}
                  </div>

                  {/* Activity card */}
                  <div className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={getActionColor(activity.action)}>
                            {activity.action}
                          </Badge>
                          <Badge variant="secondary">
                            {getTableDisplayName(activity.table_name)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(activity.created_at!), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                          <span className="text-xs">
                            ({formatDistanceToNow(new Date(activity.created_at!), { addSuffix: true, locale: es })})
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Changes details */}
                    {renderChanges(activity)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {activities.length > 0 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Mostrando {activities.length} actividad{activities.length !== 1 ? 'es' : ''} reciente{activities.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
