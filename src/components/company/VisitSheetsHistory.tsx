import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon, Filter, FileText, User, Clock, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VisitSheetsHistoryProps {
  companyId: string;
}

interface VisitSheet {
  id: string;
  visit_id: string;
  fecha: string;
  hora: string | null;
  duracion: number | null;
  canal: string | null;
  tipo_visita: string | null;
  gestor_id: string;
  gestor: {
    full_name: string | null;
    email: string;
  };
  notas_gestor: string | null;
  created_at: string;
}

export function VisitSheetsHistory({ companyId }: VisitSheetsHistoryProps) {
  const [sheets, setSheets] = useState<VisitSheet[]>([]);
  const [filteredSheets, setFilteredSheets] = useState<VisitSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filtros
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedGestor, setSelectedGestor] = useState<string>('all');
  const [selectedTipoVisita, setSelectedTipoVisita] = useState<string>('all');
  const [gestores, setGestores] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchVisitSheets();
  }, [companyId]);

  useEffect(() => {
    applyFilters();
  }, [sheets, startDate, endDate, selectedGestor, selectedTipoVisita]);

  const fetchVisitSheets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visit_sheets')
        .select(`
          *,
          gestor:profiles!visit_sheets_gestor_id_fkey(full_name, email)
        `)
        .eq('company_id', companyId)
        .order('fecha', { ascending: false });

      if (error) throw error;

      setSheets(data || []);

      // Extract unique gestores
      const uniqueGestores = Array.from(
        new Map(
          (data || []).map((sheet) => [
            sheet.gestor_id,
            {
              id: sheet.gestor_id,
              name: sheet.gestor?.full_name || sheet.gestor?.email || 'Sin nombre',
            },
          ])
        ).values()
      );
      setGestores(uniqueGestores);
    } catch (error: any) {
      console.error('Error fetching visit sheets:', error);
      toast.error('Error al cargar el historial de fichas');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sheets];

    // Filtro por rango de fechas
    if (startDate) {
      filtered = filtered.filter((sheet) => new Date(sheet.fecha) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((sheet) => new Date(sheet.fecha) <= endDate);
    }

    // Filtro por gestor
    if (selectedGestor !== 'all') {
      filtered = filtered.filter((sheet) => sheet.gestor_id === selectedGestor);
    }

    // Filtro por tipo de visita
    if (selectedTipoVisita !== 'all') {
      filtered = filtered.filter((sheet) => sheet.tipo_visita === selectedTipoVisita);
    }

    setFilteredSheets(filtered);
  };

  const viewSheetDetails = async (sheetId: string) => {
    try {
      const { data, error } = await supabase
        .from('visit_sheets')
        .select('*')
        .eq('id', sheetId)
        .single();

      if (error) throw error;

      setSelectedSheet(data);
      setDetailOpen(true);
    } catch (error: any) {
      console.error('Error loading sheet details:', error);
      toast.error('Error al cargar los detalles de la ficha');
    }
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedGestor('all');
    setSelectedTipoVisita('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Cargando historial...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Fecha inicio */}
            <div className="space-y-2">
              <Label className="text-xs">Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {startDate ? format(startDate, 'PP', { locale: es }) : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Fecha fin */}
            <div className="space-y-2">
              <Label className="text-xs">Fecha Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {endDate ? format(endDate, 'PP', { locale: es }) : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Gestor */}
            <div className="space-y-2">
              <Label className="text-xs">Gestor</Label>
              <Select value={selectedGestor} onValueChange={setSelectedGestor}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los gestores</SelectItem>
                  {gestores.map((gestor) => (
                    <SelectItem key={gestor.id} value={gestor.id}>
                      {gestor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de visita */}
            <div className="space-y-2">
              <Label className="text-xs">Tipo de Visita</Label>
              <Select value={selectedTipoVisita} onValueChange={setSelectedTipoVisita}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="Primera visita">Primera visita</SelectItem>
                  <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="Postventa">Postventa</SelectItem>
                  <SelectItem value="Renovación">Renovación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
            <X className="h-3 w-3 mr-2" />
            Limpiar Filtros
          </Button>
        </CardContent>
      </Card>

      {/* Lista de fichas */}
      <div className="space-y-2">
        {filteredSheets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {sheets.length === 0
                  ? 'No hay fichas de visita registradas'
                  : 'No se encontraron fichas con los filtros aplicados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSheets.map((sheet) => (
            <Card key={sheet.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {format(new Date(sheet.fecha), 'dd MMM yyyy', { locale: es })}
                      </Badge>
                      {sheet.hora && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {sheet.hora}
                        </Badge>
                      )}
                      {sheet.tipo_visita && (
                        <Badge className="text-xs">{sheet.tipo_visita}</Badge>
                      )}
                      {sheet.canal && (
                        <Badge variant="outline" className="text-xs">
                          {sheet.canal}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{sheet.gestor?.full_name || sheet.gestor?.email}</span>
                    </div>

                    {sheet.notas_gestor && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {sheet.notas_gestor}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => viewSheetDetails(sheet.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de detalles */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ficha de Visita - {selectedSheet?.fecha && format(new Date(selectedSheet.fecha), 'dd MMM yyyy', { locale: es })}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
            {selectedSheet && (
              <div className="space-y-6">
                {/* Datos de la visita */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Datos de la Visita</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fecha:</span> {format(new Date(selectedSheet.fecha), 'dd/MM/yyyy', { locale: es })}
                    </div>
                    {selectedSheet.hora && (
                      <div>
                        <span className="text-muted-foreground">Hora:</span> {selectedSheet.hora}
                      </div>
                    )}
                    {selectedSheet.duracion && (
                      <div>
                        <span className="text-muted-foreground">Duración:</span> {selectedSheet.duracion} min
                      </div>
                    )}
                    {selectedSheet.canal && (
                      <div>
                        <span className="text-muted-foreground">Canal:</span> {selectedSheet.canal}
                      </div>
                    )}
                    {selectedSheet.tipo_visita && (
                      <div>
                        <span className="text-muted-foreground">Tipo:</span> {selectedSheet.tipo_visita}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Datos del cliente */}
                {(selectedSheet.tipo_cliente || selectedSheet.persona_contacto) && (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Datos del Cliente</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {selectedSheet.tipo_cliente && (
                          <div>
                            <span className="text-muted-foreground">Tipo:</span> {selectedSheet.tipo_cliente}
                          </div>
                        )}
                        {selectedSheet.persona_contacto && (
                          <div>
                            <span className="text-muted-foreground">Contacto:</span> {selectedSheet.persona_contacto}
                          </div>
                        )}
                        {selectedSheet.cargo_contacto && (
                          <div>
                            <span className="text-muted-foreground">Cargo:</span> {selectedSheet.cargo_contacto}
                          </div>
                        )}
                        {selectedSheet.telefono_contacto && (
                          <div>
                            <span className="text-muted-foreground">Teléfono:</span> {selectedSheet.telefono_contacto}
                          </div>
                        )}
                        {selectedSheet.email_contacto && (
                          <div>
                            <span className="text-muted-foreground">Email:</span> {selectedSheet.email_contacto}
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Notas del gestor */}
                {selectedSheet.notas_gestor && (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Notas del Gestor</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedSheet.notas_gestor}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Evaluación del potencial */}
                {(selectedSheet.potencial_anual_estimado || selectedSheet.probabilidad_cierre) && (
                  <>
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Evaluación del Potencial</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {selectedSheet.potencial_anual_estimado && (
                          <div>
                            <span className="text-muted-foreground">Potencial anual:</span>{' '}
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(selectedSheet.potencial_anual_estimado)}
                          </div>
                        )}
                        {selectedSheet.probabilidad_cierre && (
                          <div>
                            <span className="text-muted-foreground">Probabilidad de cierre:</span> {selectedSheet.probabilidad_cierre}%
                          </div>
                        )}
                        {selectedSheet.nivel_vinculacion_recomendado && (
                          <div>
                            <span className="text-muted-foreground">Vinculación recomendada:</span> {selectedSheet.nivel_vinculacion_recomendado}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
