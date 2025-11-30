import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, FileText, Search, Filter, Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { visitSheetUpdateSchema } from '@/lib/validations';

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
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedProbability, setSelectedProbability] = useState<string>('all');
  const [selectedSheet, setSelectedSheet] = useState<any | null>(null);
  const [editedSheet, setEditedSheet] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [gestores, setGestores] = useState<Array<{ id: string; full_name: string }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      fetchSheets();
      fetchGestores();
      fetchCompanies();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [sheets, searchTerm, dateFrom, dateTo, selectedGestor, selectedCompany, selectedProbability]);

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

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
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

    // Filtrar por empresa
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(sheet => sheet.company.id === selectedCompany);
    }

    // Filtrar por probabilidad de cierre
    if (selectedProbability !== 'all') {
      filtered = filtered.filter(sheet => {
        if (sheet.probabilidad_cierre === null) return false;
        
        switch (selectedProbability) {
          case 'alta':
            return sheet.probabilidad_cierre >= 75;
          case 'media':
            return sheet.probabilidad_cierre >= 50 && sheet.probabilidad_cierre < 75;
          case 'baja':
            return sheet.probabilidad_cierre < 50;
          default:
            return true;
        }
      });
    }

    setFilteredSheets(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedGestor('all');
    setSelectedCompany('all');
    setSelectedProbability('all');
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
      setEditedSheet(data);
      setSaveStatus('idle');
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching sheet details:', error);
      toast.error('Error al cargar los detalles');
    }
  };

  const handleFieldChange = useCallback((field: string, value: any) => {
    setEditedSheet((prev: any) => ({
      ...prev,
      [field]: value
    }));

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1 second debounce)
    setSaveStatus('idle');
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(field, value);
    }, 1000);
  }, []);

  const autoSave = async (field: string, value: any) => {
    if (!editedSheet || !selectedSheet) return;

    try {
      setSaveStatus('saving');

      // Validate the update data
      const updateData: any = {
        [field]: value
      };

      const validationResult = visitSheetUpdateSchema.safeParse(updateData);
      
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Error de validación';
        toast.error(errorMessage);
        setSaveStatus('error');
        return;
      }

      const { error } = await supabase
        .from('visit_sheets')
        .update(updateData)
        .eq('id', selectedSheet.id);

      if (error) throw error;

      setSaveStatus('saved');
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);

      // Update the main sheets list
      setSheets(prevSheets => 
        prevSheets.map(sheet => 
          sheet.id === selectedSheet.id 
            ? { ...sheet, [field]: value }
            : sheet
        )
      );

    } catch (error: any) {
      console.error('Error auto-saving:', error);
      toast.error('Error al guardar los cambios');
      setSaveStatus('error');
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
          {/* Primera fila: Búsqueda y rango de fechas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Búsqueda general</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Empresa, gestor, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Fecha desde */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha desde</label>
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
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Fecha hasta */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha hasta</label>
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
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Segunda fila: Filtros específicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Empresa */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gestor */}
            {(isAdmin || isCommercialDirector || isOfficeDirector || isCommercialManager) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Gestor</label>
                <Select value={selectedGestor} onValueChange={setSelectedGestor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los gestores" />
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

            {/* Probabilidad de cierre */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Probabilidad de cierre</label>
              <Select value={selectedProbability} onValueChange={setSelectedProbability}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las probabilidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las probabilidades</SelectItem>
                  <SelectItem value="alta">Alta (≥75%)</SelectItem>
                  <SelectItem value="media">Media (50-74%)</SelectItem>
                  <SelectItem value="baja">Baja (&lt;50%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

      {/* Dialog de detalles con edición */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalles de la Ficha de Visita</span>
              {saveStatus === 'saving' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Guardando...
                </Badge>
              )}
              {saveStatus === 'saved' && (
                <Badge variant="default" className="flex items-center gap-1 bg-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  Guardado
                </Badge>
              )}
              {saveStatus === 'error' && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {editedSheet && selectedSheet && (
            <ScrollArea className="h-[calc(90vh-8rem)]">
              <div className="space-y-6 pr-4">
                {/* Información básica (no editable) */}
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

                {/* Campos editables */}
                <div className="space-y-4">
                  {/* Tipo de visita */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Visita</label>
                    <Input
                      value={editedSheet.tipo_visita || ''}
                      onChange={(e) => handleFieldChange('tipo_visita', e.target.value)}
                      placeholder="Ej: Primera visita, Seguimiento, Cierre..."
                      maxLength={100}
                    />
                  </div>

                  {/* Notas del gestor */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notas del Gestor</label>
                    <Textarea
                      value={editedSheet.notas_gestor || ''}
                      onChange={(e) => handleFieldChange('notas_gestor', e.target.value)}
                      placeholder="Escribe tus notas aquí..."
                      rows={6}
                      maxLength={5000}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {editedSheet.notas_gestor?.length || 0} / 5000
                    </p>
                  </div>

                  {/* Métricas editables */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Probabilidad de Cierre (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editedSheet.probabilidad_cierre ?? ''}
                        onChange={(e) => handleFieldChange('probabilidad_cierre', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="0-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Potencial Anual Estimado (€)</label>
                      <Input
                        type="number"
                        min="0"
                        value={editedSheet.potencial_anual_estimado ?? ''}
                        onChange={(e) => handleFieldChange('potencial_anual_estimado', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Nivel de vinculación recomendado */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nivel de Vinculación Recomendado</label>
                    <Input
                      value={editedSheet.nivel_vinculacion_recomendado || ''}
                      onChange={(e) => handleFieldChange('nivel_vinculacion_recomendado', e.target.value)}
                      placeholder="Ej: Alto, Medio, Bajo..."
                      maxLength={100}
                    />
                  </div>

                  {/* Oportunidades futuras */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Oportunidades Futuras</label>
                    <Textarea
                      value={editedSheet.oportunidades_futuras || ''}
                      onChange={(e) => handleFieldChange('oportunidades_futuras', e.target.value)}
                      placeholder="Describe las oportunidades identificadas..."
                      rows={4}
                      maxLength={2000}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {editedSheet.oportunidades_futuras?.length || 0} / 2000
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Información adicional no editable */}
                <div className="space-y-4 text-sm">
                  {selectedSheet.canal && (
                    <div>
                      <p className="font-medium">Canal</p>
                      <p className="text-muted-foreground">{selectedSheet.canal}</p>
                    </div>
                  )}
                  {selectedSheet.duracion && (
                    <div>
                      <p className="font-medium">Duración (minutos)</p>
                      <p className="text-muted-foreground">{selectedSheet.duracion}</p>
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