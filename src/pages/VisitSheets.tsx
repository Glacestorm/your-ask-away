import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, FileText, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface VisitSheet {
  id: string;
  fecha: string;
  hora: string | null;
  tipo_visita: string | null;
  company: {
    id: string;
    name: string;
  };
  gestor: {
    id: string;
    full_name: string;
    email: string;
  };
  notas_gestor: string | null;
  probabilidad_cierre: number | null;
  potencial_anual_estimado: number | null;
}

export default function VisitSheets() {
  const { user, isAdmin, isCommercialDirector, isOfficeDirector, isCommercialManager } = useAuth();
  const [sheets, setSheets] = useState<VisitSheet[]>([]);
  const [filteredSheets, setFilteredSheets] = useState<VisitSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedGestor, setSelectedGestor] = useState<string>('all');
  const [selectedSheet, setSelectedSheet] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [gestores, setGestores] = useState<Array<{ id: string; full_name: string }>>([]);

  useEffect(() => {
    if (user) {
      fetchSheets();
      fetchGestores();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [sheets, searchTerm, dateFrom, dateTo, selectedGestor]);

  const fetchGestores = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setGestores(data || []);
    } catch (error) {
      console.error('Error fetching gestores:', error);
    }
  };

  const fetchSheets = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('visit_sheets')
        .select(`
          *,
          company:companies(id, name),
          gestor:profiles!visit_sheets_gestor_id_fkey(id, full_name, email)
        `)
        .order('fecha', { ascending: false });

      // Si el usuario no es admin, filtrar por sus propias fichas
      if (!isAdmin && !isCommercialDirector && !isOfficeDirector && !isCommercialManager) {
        query = query.eq('gestor_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSheets(data || []);
      setFilteredSheets(data || []);
    } catch (error: any) {
      console.error('Error fetching visit sheets:', error);
      toast.error('Error al cargar las fichas de visita');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sheets];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(sheet =>
        sheet.company.name.toLowerCase().includes(lowerSearch) ||
        sheet.gestor.full_name.toLowerCase().includes(lowerSearch) ||
        sheet.gestor.email.toLowerCase().includes(lowerSearch)
      );
    }

    // Filtrar por fecha desde
    if (dateFrom) {
      filtered = filtered.filter(sheet => new Date(sheet.fecha) >= dateFrom);
    }

    // Filtrar por fecha hasta
    if (dateTo) {
      filtered = filtered.filter(sheet => new Date(sheet.fecha) <= dateTo);
    }

    // Filtrar por gestor
    if (selectedGestor !== 'all') {
      filtered = filtered.filter(sheet => sheet.gestor.id === selectedGestor);
    }

    setFilteredSheets(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedGestor('all');
  };

  const handleViewDetails = async (sheetId: string) => {
    try {
      const { data, error } = await supabase
        .from('visit_sheets')
        .select(`
          *,
          company:companies(*),
          gestor:profiles!visit_sheets_gestor_id_fkey(*),
          visit:visits(*)
        `)
        .eq('id', sheetId)
        .single();

      if (error) throw error;
      setSelectedSheet(data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching sheet details:', error);
      toast.error('Error al cargar los detalles');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Cargando fichas de visita...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Fichas de Visita</h1>
        </div>
        <Badge variant="secondary" className="text-lg">
          {filteredSheets.length} fichas
        </Badge>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Empresa, gestor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Fecha desde */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Desde</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Fecha hasta */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Hasta</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Gestor */}
            {(isAdmin || isCommercialDirector || isOfficeDirector || isCommercialManager) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Gestor</label>
                <Select value={selectedGestor} onValueChange={setSelectedGestor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los gestores</SelectItem>
                    {gestores.map(gestor => (
                      <SelectItem key={gestor.id} value={gestor.id}>
                        {gestor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de fichas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSheets.map(sheet => (
          <Card key={sheet.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewDetails(sheet.id)}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="truncate">{sheet.company.name}</span>
                <Badge variant="outline">
                  {format(new Date(sheet.fecha), 'dd/MM/yy')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                <p><strong>Gestor:</strong> {sheet.gestor.full_name}</p>
                {sheet.tipo_visita && (
                  <p><strong>Tipo:</strong> {sheet.tipo_visita}</p>
                )}
                {sheet.hora && (
                  <p><strong>Hora:</strong> {sheet.hora}</p>
                )}
              </div>
              
              {(sheet.probabilidad_cierre !== null || sheet.potencial_anual_estimado !== null) && (
                <>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    {sheet.probabilidad_cierre !== null && (
                      <p><strong>Prob. Cierre:</strong> {sheet.probabilidad_cierre}%</p>
                    )}
                    {sheet.potencial_anual_estimado !== null && (
                      <p><strong>Potencial:</strong> €{sheet.potencial_anual_estimado.toLocaleString()}</p>
                    )}
                  </div>
                </>
              )}

              {sheet.notas_gestor && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sheet.notas_gestor}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSheets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron fichas</h3>
            <p className="text-muted-foreground">
              {sheets.length === 0 
                ? 'Aún no hay fichas de visita registradas'
                : 'Prueba ajustando los filtros de búsqueda'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de detalles */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalles de la Ficha de Visita</DialogTitle>
          </DialogHeader>
          
          {selectedSheet && (
            <ScrollArea className="h-[calc(90vh-8rem)]">
              <div className="space-y-6 pr-4">
                {/* Información básica */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                    <p className="text-lg font-semibold">{selectedSheet.company?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gestor</p>
                    <p className="text-lg">{selectedSheet.gestor?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                    <p className="text-lg">{format(new Date(selectedSheet.fecha), 'dd/MM/yyyy', { locale: es })}</p>
                  </div>
                  {selectedSheet.hora && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Hora</p>
                      <p className="text-lg">{selectedSheet.hora}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Notas del gestor */}
                {selectedSheet.notas_gestor && (
                  <>
                    <div>
                      <h3 className="font-semibold mb-2">Notas del Gestor</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedSheet.notas_gestor}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Métricas */}
                {(selectedSheet.probabilidad_cierre !== null || selectedSheet.potencial_anual_estimado !== null) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedSheet.probabilidad_cierre !== null && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Probabilidad de Cierre</p>
                          <p className="text-2xl font-bold text-primary">{selectedSheet.probabilidad_cierre}%</p>
                        </div>
                      )}
                      {selectedSheet.potencial_anual_estimado !== null && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Potencial Anual Estimado</p>
                          <p className="text-2xl font-bold text-primary">
                            €{selectedSheet.potencial_anual_estimado.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <Separator />
                  </>
                )}

                {/* Información adicional */}
                <div className="space-y-4 text-sm">
                  {selectedSheet.tipo_visita && (
                    <div>
                      <p className="font-medium">Tipo de Visita</p>
                      <p className="text-muted-foreground">{selectedSheet.tipo_visita}</p>
                    </div>
                  )}
                  {selectedSheet.canal && (
                    <div>
                      <p className="font-medium">Canal</p>
                      <p className="text-muted-foreground">{selectedSheet.canal}</p>
                    </div>
                  )}
                  {selectedSheet.nivel_vinculacion_recomendado && (
                    <div>
                      <p className="font-medium">Nivel de Vinculación Recomendado</p>
                      <p className="text-muted-foreground">{selectedSheet.nivel_vinculacion_recomendado}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}