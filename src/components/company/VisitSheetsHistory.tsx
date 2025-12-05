import { useState, useEffect, useMemo } from 'react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Filter, FileText, User, Clock, Eye, X, Search, ChevronDown, Package, TrendingUp, Download, BarChart3, List } from 'lucide-react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Lista de productos disponibles para filtrar
const AVAILABLE_PRODUCTS = [
  { key: 'prestamo', label: 'Préstamo' },
  { key: 'hipoteca', label: 'Hipoteca' },
  { key: 'cuenta_corriente', label: 'Cuenta Corriente' },
  { key: 'tpv', label: 'TPV' },
  { key: 'inversion', label: 'Inversión' },
  { key: 'seguros', label: 'Seguros' },
  { key: 'leasing', label: 'Leasing' },
  { key: 'renting', label: 'Renting' },
  { key: 'factoring', label: 'Factoring' },
  { key: 'confirming', label: 'Confirming' },
  { key: 'tarjetas', label: 'Tarjetas' },
  { key: 'depositos', label: 'Depósitos' },
];

interface VisitSheetsHistoryProps {
  companyId: string;
  defaultOpen?: boolean;
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
  probabilidad_cierre: number | null;
  potencial_anual_estimado: number | null;
  productos_servicios: any;
  propuesta_valor: any;
}

export function VisitSheetsHistory({ companyId, defaultOpen = true }: VisitSheetsHistoryProps) {
  const [sheets, setSheets] = useState<VisitSheet[]>([]);
  const [filteredSheets, setFilteredSheets] = useState<VisitSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedGestor, setSelectedGestor] = useState<string>('all');
  const [selectedTipoVisita, setSelectedTipoVisita] = useState<string>('all');
  const [selectedProbability, setSelectedProbability] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [gestores, setGestores] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchVisitSheets();
  }, [companyId]);

  useEffect(() => {
    applyFilters();
  }, [sheets, searchTerm, startDate, endDate, selectedGestor, selectedTipoVisita, selectedProbability, selectedProducts]);

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

      setSheets(data as any || []);

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

    // Búsqueda general
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((sheet) => {
        const gestorName = sheet.gestor?.full_name?.toLowerCase() || '';
        const gestorEmail = sheet.gestor?.email?.toLowerCase() || '';
        const notas = sheet.notas_gestor?.toLowerCase() || '';
        const tipoVisita = sheet.tipo_visita?.toLowerCase() || '';
        const canal = sheet.canal?.toLowerCase() || '';
        
        // Buscar en productos/propuesta
        let productMatch = false;
        if (sheet.propuesta_valor && Array.isArray(sheet.propuesta_valor)) {
          productMatch = sheet.propuesta_valor.some((p: string) => 
            p.toLowerCase().includes(lowerSearch)
          );
        }
        if (sheet.productos_servicios) {
          const productsStr = JSON.stringify(sheet.productos_servicios).toLowerCase();
          productMatch = productMatch || productsStr.includes(lowerSearch);
        }

        return (
          gestorName.includes(lowerSearch) ||
          gestorEmail.includes(lowerSearch) ||
          notas.includes(lowerSearch) ||
          tipoVisita.includes(lowerSearch) ||
          canal.includes(lowerSearch) ||
          productMatch
        );
      });
    }

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

    // Filtro por probabilidad de cierre
    if (selectedProbability !== 'all') {
      filtered = filtered.filter((sheet) => {
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

    // Filtro por productos específicos
    if (selectedProducts.length > 0) {
      filtered = filtered.filter((sheet) => {
        // Buscar en productos_servicios
        const productsStr = JSON.stringify(sheet.productos_servicios || {}).toLowerCase();
        const propuestaStr = JSON.stringify(sheet.propuesta_valor || []).toLowerCase();
        
        return selectedProducts.some((product) => {
          const productLower = product.toLowerCase();
          return productsStr.includes(productLower) || propuestaStr.includes(productLower);
        });
      });
    }

    setFilteredSheets(filtered);
  };

  const toggleProduct = (productKey: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productKey)
        ? prev.filter((p) => p !== productKey)
        : [...prev, productKey]
    );
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
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedGestor('all');
    setSelectedTipoVisita('all');
    setSelectedProbability('all');
    setSelectedProducts([]);
  };

  const exportToExcel = () => {
    if (filteredSheets.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const exportData = filteredSheets.map((sheet) => ({
      'Fecha': format(new Date(sheet.fecha), 'dd/MM/yyyy', { locale: es }),
      'Hora': sheet.hora || '',
      'Duración (min)': sheet.duracion || '',
      'Canal': sheet.canal || '',
      'Tipo Visita': sheet.tipo_visita || '',
      'Gestor': sheet.gestor?.full_name || sheet.gestor?.email || '',
      'Probabilidad Cierre (%)': sheet.probabilidad_cierre || '',
      'Potencial Anual (€)': sheet.potencial_anual_estimado || '',
      'Productos/Servicios': sheet.productos_servicios ? JSON.stringify(sheet.productos_servicios) : '',
      'Propuesta Valor': sheet.propuesta_valor ? (Array.isArray(sheet.propuesta_valor) ? sheet.propuesta_valor.join(', ') : JSON.stringify(sheet.propuesta_valor)) : '',
      'Notas': sheet.notas_gestor || '',
      'Fecha Creación': format(new Date(sheet.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fichas de Visita');

    // Ajustar anchos de columnas
    const colWidths = [
      { wch: 12 }, // Fecha
      { wch: 8 },  // Hora
      { wch: 12 }, // Duración
      { wch: 12 }, // Canal
      { wch: 15 }, // Tipo Visita
      { wch: 25 }, // Gestor
      { wch: 18 }, // Probabilidad
      { wch: 15 }, // Potencial
      { wch: 40 }, // Productos
      { wch: 40 }, // Propuesta
      { wch: 50 }, // Notas
      { wch: 16 }, // Fecha Creación
    ];
    worksheet['!cols'] = colWidths;

    const fileName = `fichas_visita_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success('Exportación completada');
  };

  // Calculate chart data for monthly evolution and products
  const chartData = useMemo(() => {
    const monthlyData: { [key: string]: { month: string; fichas: number; products: { [key: string]: number } } } = {};
    const productCounts: { [key: string]: number } = {};

    filteredSheets.forEach((sheet) => {
      const monthKey = format(startOfMonth(parseISO(sheet.fecha)), 'yyyy-MM');
      const monthLabel = format(parseISO(sheet.fecha), 'MMM yyyy', { locale: es });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, fichas: 0, products: {} };
      }
      monthlyData[monthKey].fichas++;

      // Count products
      const extractProducts = (data: any): string[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data.map(String);
        if (typeof data === 'object') {
          return Object.keys(data).filter(k => data[k]);
        }
        return [];
      };

      const sheetProducts = [
        ...extractProducts(sheet.productos_servicios),
        ...extractProducts(sheet.propuesta_valor),
      ];

      sheetProducts.forEach((product) => {
        const productLower = product.toLowerCase();
        AVAILABLE_PRODUCTS.forEach((ap) => {
          if (productLower.includes(ap.key)) {
            productCounts[ap.label] = (productCounts[ap.label] || 0) + 1;
            monthlyData[monthKey].products[ap.label] = (monthlyData[monthKey].products[ap.label] || 0) + 1;
          }
        });
      });
    });

    const monthlyArray = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);

    const topProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    return { monthlyArray, topProducts };
  }, [filteredSheets]);

  const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Cargando historial...</div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Historial de Fichas de Visita
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportToExcel();
                  }}
                  disabled={filteredSheets.length === 0}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Excel
                </Button>
                <Badge variant="secondary" className="text-xs">
                  {filteredSheets.length} fichas
                </Badge>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Búsqueda general */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por gestor, notas, productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Filtros colapsables */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    Filtros avanzados
                  </div>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Fecha inicio */}
                  <div className="space-y-1">
                    <Label className="text-xs">Desde</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'w-full justify-start text-left font-normal text-xs',
                            !startDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {startDate ? format(startDate, 'dd/MM/yy', { locale: es }) : 'Fecha'}
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
                  <div className="space-y-1">
                    <Label className="text-xs">Hasta</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'w-full justify-start text-left font-normal text-xs',
                            !endDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {endDate ? format(endDate, 'dd/MM/yy', { locale: es }) : 'Fecha'}
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
                  <div className="space-y-1">
                    <Label className="text-xs">Gestor</Label>
                    <Select value={selectedGestor} onValueChange={setSelectedGestor}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {gestores.map((gestor) => (
                          <SelectItem key={gestor.id} value={gestor.id}>
                            {gestor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo de visita */}
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo Visita</Label>
                    <Select value={selectedTipoVisita} onValueChange={setSelectedTipoVisita}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Primera visita">Primera visita</SelectItem>
                        <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                        <SelectItem value="Postventa">Postventa</SelectItem>
                        <SelectItem value="Renovación">Renovación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Probabilidad de cierre */}
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Probabilidad Cierre</Label>
                    <Select value={selectedProbability} onValueChange={setSelectedProbability}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="alta">Alta (≥75%)</SelectItem>
                        <SelectItem value="media">Media (50-74%)</SelectItem>
                        <SelectItem value="baja">Baja (&lt;50%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por productos */}
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Productos Ofrecidos
                    </Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {AVAILABLE_PRODUCTS.map((product) => (
                        <div key={product.key} className="flex items-center space-x-1.5">
                          <Checkbox
                            id={`product-${product.key}`}
                            checked={selectedProducts.includes(product.key)}
                            onCheckedChange={() => toggleProduct(product.key)}
                            className="h-3 w-3"
                          />
                          <label
                            htmlFor={`product-${product.key}`}
                            className="text-[10px] leading-none cursor-pointer"
                          >
                            {product.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProducts.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px] h-5">
                            {AVAILABLE_PRODUCTS.find((ap) => ap.key === p)?.label}
                            <X
                              className="h-2.5 w-2.5 ml-1 cursor-pointer"
                              onClick={() => toggleProduct(p)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                  <X className="h-3 w-3 mr-2" />
                  Limpiar Filtros
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Tabs para lista y gráficos */}
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="list" className="text-xs">
                  <List className="h-3 w-3 mr-1" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="charts" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Gráficos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-3">
                {/* Lista de fichas */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-4">
                    {filteredSheets.length === 0 ? (
                      <div className="p-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          {sheets.length === 0
                            ? 'No hay fichas de visita registradas'
                            : 'No se encontraron fichas con los filtros aplicados'}
                        </p>
                      </div>
                    ) : (
                      filteredSheets.map((sheet) => (
                        <Card key={sheet.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => viewSheetDetails(sheet.id)}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
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
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{sheet.gestor?.full_name || sheet.gestor?.email}</span>
                                </div>

                                {/* Probabilidad y potencial */}
                                {(sheet.probabilidad_cierre || sheet.potencial_anual_estimado) && (
                                  <div className="flex items-center gap-2 text-xs">
                                    {sheet.probabilidad_cierre && (
                                      <Badge variant={sheet.probabilidad_cierre >= 75 ? "default" : sheet.probabilidad_cierre >= 50 ? "secondary" : "outline"} className="text-xs">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        {sheet.probabilidad_cierre}%
                                      </Badge>
                                    )}
                                    {sheet.potencial_anual_estimado && (
                                      <span className="text-muted-foreground">
                                        €{sheet.potencial_anual_estimado.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {sheet.notas_gestor && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {sheet.notas_gestor}
                                  </p>
                                )}
                              </div>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewSheetDetails(sheet.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="charts" className="mt-3 space-y-4">
                {filteredSheets.length === 0 ? (
                  <div className="p-8 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">No hay datos para mostrar gráficos</p>
                  </div>
                ) : (
                  <>
                    {/* Evolución mensual */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3" />
                        Evolución Mensual de Fichas
                      </h4>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.monthlyArray}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
                            <Tooltip
                              contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                              labelStyle={{ fontWeight: 600 }}
                            />
                            <Bar dataKey="fichas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Fichas" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Productos más ofrecidos */}
                    {chartData.topProducts.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium flex items-center gap-1.5">
                          <Package className="h-3 w-3" />
                          Productos Más Ofrecidos
                        </h4>
                        <div className="h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData.topProducts}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                labelLine={false}
                              >
                                {chartData.topProducts.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                formatter={(value: number) => [`${value} fichas`, 'Cantidad']}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {chartData.topProducts.map((product, index) => (
                            <Badge key={product.name} variant="outline" className="text-[10px]">
                              <span className="w-2 h-2 rounded-full mr-1" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                              {product.name}: {product.value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>

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
    </Collapsible>
  );
}
