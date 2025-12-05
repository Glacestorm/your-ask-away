import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History, Search, User, Calendar, FileText, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
    company?: {
      name: string;
    };
  };
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

  useEffect(() => {
    fetchAuditRecords();
  }, [page, filterAction]);

  const fetchAuditRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('visit_sheet_audit')
        .select(`
          *,
          visit_sheet:visit_sheets(
            company:companies(name)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }

      const { data, error, count } = await query;

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

      const enrichedData = (data || []).map(record => ({
        ...record,
        user_profile: record.user_id ? profiles[record.user_id] : null
      }));

      setAuditRecords(enrichedData);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching audit records:', error);
    } finally {
      setLoading(false);
    }
  };

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
          {/* Filters */}
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
            <Select value={filterAction} onValueChange={setFilterAction}>
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
