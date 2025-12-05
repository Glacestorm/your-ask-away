import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { History, Search, User, Calendar as CalendarIcon, FileText, Eye, ChevronLeft, ChevronRight, Building2, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AuditRecord {
  id: string;
  visit_sheet_id: string;
  user_id: string | null;
  action: string;
  old_data: any;
  new_data: any;
  changed_fields: string[] | null;
  created_at: string;
  user_profile?: {
    full_name: string | null;
    email: string;
  };
  visit_sheet?: {
    gestor_id?: string;
    company?: {
      name: string;
    };
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface Company {
  id: string;
  name: string;
}

const FIELD_LABELS: Record<string, string> = {
  fecha: 'Fecha',
  hora: 'Hora',
  duracion: 'Duración',
  canal: 'Canal',
  tipo_visita: 'Tipo de visita',
  tipo_cliente: 'Tipo de cliente',
  persona_contacto: 'Persona de contacto',
  cargo_contacto: 'Cargo',
  notas_gestor: 'Notas del gestor',
  probabilidad_cierre: 'Probabilidad de cierre',
  potencial_anual_estimado: 'Potencial anual',
  proxima_cita: 'Próxima cita',
  proxima_llamada: 'Próxima llamada',
  facturacion_anual: 'Facturación anual',
  diagnostico_inicial: 'Diagnóstico inicial',
  necesidades_detectadas: 'Necesidades detectadas',
  propuesta_valor: 'Propuesta de valor',
  productos_servicios: 'Productos/Servicios',
  acciones_acordadas: 'Acciones acordadas',
  responsable_seguimiento: 'Responsable seguimiento'
};

export const VisitSheetAuditViewer = () => {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Advanced filters
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedGestor, setSelectedGestor] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchAuditRecords();
  }, [page, filterAction, selectedGestor, selectedCompany, startDate, endDate]);

  const fetchFiltersData = async () => {
    // Fetch gestores
    const { data: gestoresData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name');
    
    if (gestoresData) setGestores(gestoresData);

    // Fetch companies
    const { data: companiesData } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');
    
    if (companiesData) setCompanies(companiesData);
  };

  const fetchAuditRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('visit_sheet_audit')
        .select(`
          *,
          visit_sheet:visit_sheets(
            gestor_id,
            company_id,
            company:companies(name)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(data?.map(r => r.user_id).filter(Boolean) || [])];
      let profiles: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        profiles = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, any>);
      }

      let enrichedData = (data || []).map(record => ({
        ...record,
        user_profile: record.user_id ? profiles[record.user_id] : null
      }));

      // Apply gestor filter (client-side due to nested structure)
      if (selectedGestor !== 'all') {
        enrichedData = enrichedData.filter(r => r.visit_sheet?.gestor_id === selectedGestor);
      }

      // Apply company filter (client-side due to nested structure)
      if (selectedCompany !== 'all') {
        enrichedData = enrichedData.filter(r => r.visit_sheet?.company_id === selectedCompany);
      }

      setAuditRecords(enrichedData);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching audit records:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterAction('all');
    setSelectedGestor('all');
    setSelectedCompany('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilters = filterAction !== 'all' || selectedGestor !== 'all' || selectedCompany !== 'all' || startDate || endDate || searchTerm;

  const filteredRecords = auditRecords.filter(record => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      record.user_profile?.full_name?.toLowerCase().includes(search) ||
      record.user_profile?.email?.toLowerCase().includes(search) ||
      record.visit_sheet?.company?.name?.toLowerCase().includes(search)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-green-500">Creación</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-500">Modificación</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Eliminación</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const renderFieldChange = (field: string, oldValue: any, newValue: any) => {
    const formatValue = (value: any) => {
      if (value === null || value === undefined) return '(vacío)';
      if (typeof value === 'object') return JSON.stringify(value, null, 2);
      return String(value);
    };

    return (
      <div key={field} className="border-b border-border/50 pb-2 mb-2 last:border-0">
        <p className="font-medium text-sm text-foreground">{FIELD_LABELS[field] || field}</p>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-destructive/10 p-2 rounded text-xs">
            <span className="text-muted-foreground">Antes:</span>
            <pre className="whitespace-pre-wrap mt-1">{formatValue(oldValue)}</pre>
          </div>
          <div className="bg-green-500/10 p-2 rounded text-xs">
            <span className="text-muted-foreground">Después:</span>
            <pre className="whitespace-pre-wrap mt-1">{formatValue(newValue)}</pre>
          </div>
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Auditoría - Fichas de Visita
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Basic Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="INSERT">Creaciones</SelectItem>
                <SelectItem value="UPDATE">Modificaciones</SelectItem>
                <SelectItem value="DELETE">Eliminaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
            </div>
            
            {/* Gestor Filter */}
            <Select value={selectedGestor} onValueChange={(v) => { setSelectedGestor(v); setPage(1); }}>
              <SelectTrigger>
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los gestores</SelectItem>
                {gestores.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.full_name || g.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Company Filter */}
            <Select value={selectedCompany} onValueChange={(v) => { setSelectedCompany(v); setPage(1); }}>
              <SelectTrigger>
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yy") : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => { setStartDate(d); setPage(1); }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yy") : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => { setEndDate(d); setPage(1); }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="col-span-full sm:col-span-1">
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Total registros</p>
              <p className="text-xl font-bold">{totalCount}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Página</p>
              <p className="text-xl font-bold">{page} / {totalPages || 1}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Mostrando</p>
              <p className="text-xl font-bold">{filteredRecords.length}</p>
            </Card>
          </div>

          {/* Records List */}
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No se encontraron registros de auditoría</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecords.map((record) => (
                  <Card
                    key={record.id}
                    className="p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getActionBadge(record.action)}
                          <span className="text-sm font-medium truncate">
                            {record.visit_sheet?.company?.name || 'Empresa desconocida'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {record.user_profile?.full_name || record.user_profile?.email || 'Sistema'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(record.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                          </span>
                        </div>
                        {record.changed_fields && record.changed_fields.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {record.changed_fields.slice(0, 3).map(field => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {FIELD_LABELS[field] || field}
                              </Badge>
                            ))}
                            {record.changed_fields.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{record.changed_fields.length - 3} más
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRecord && getActionBadge(selectedRecord.action)}
              Detalle de cambio
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Empresa</p>
                  <p className="font-medium">{selectedRecord.visit_sheet?.company?.name || 'Desconocida'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Usuario</p>
                  <p className="font-medium">
                    {selectedRecord.user_profile?.full_name || selectedRecord.user_profile?.email || 'Sistema'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha y hora</p>
                  <p className="font-medium">
                    {format(new Date(selectedRecord.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Acción</p>
                  <p className="font-medium">{selectedRecord.action}</p>
                </div>
              </div>

              {selectedRecord.action === 'UPDATE' && selectedRecord.changed_fields && (
                <div>
                  <h4 className="font-medium mb-3">Campos modificados</h4>
                  <div className="space-y-2">
                    {selectedRecord.changed_fields.map(field => 
                      renderFieldChange(
                        field,
                        selectedRecord.old_data?.[field],
                        selectedRecord.new_data?.[field]
                      )
                    )}
                  </div>
                </div>
              )}

              {selectedRecord.action === 'INSERT' && selectedRecord.new_data && (
                <div>
                  <h4 className="font-medium mb-3">Datos creados</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedRecord.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedRecord.action === 'DELETE' && selectedRecord.old_data && (
                <div>
                  <h4 className="font-medium mb-3">Datos eliminados</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedRecord.old_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
