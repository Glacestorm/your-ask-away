import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CompanyWithDetails, MapFilters, StatusColor, Product, Profile } from '@/types/database';
import { Search, X, Calendar, TrendingUp, Building, Maximize2, Minimize2, Users, MapPin, Package, Tag, DollarSign, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectorStats } from './SectorStats';
import { formatCnaeWithDescription } from '@/lib/cnaeDescriptions';
import { CompanyDetail } from '@/components/company/CompanyDetail';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';

interface MapSidebarProps {
  open: boolean;
  companies: CompanyWithDetails[];
  statusColors: StatusColor[];
  products: Product[];
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  selectedCompany: CompanyWithDetails | null;
  onSelectCompany: (company: CompanyWithDetails | null) => void;
  fullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
}

export function MapSidebar({
  open,
  companies,
  statusColors,
  products,
  filters,
  onFiltersChange,
  selectedCompany,
  onSelectCompany,
  fullscreen = false,
  onFullscreenChange,
}: MapSidebarProps) {
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [parroquias, setParroquias] = useState<string[]>([]);
  const [cnaes, setCnaes] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  
  // Density mode: compact (dense) or expanded (spacious)
  const [densityMode, setDensityMode] = useState<'compact' | 'expanded'>(() => {
    const saved = localStorage.getItem('map-sidebar-density');
    return (saved === 'compact' || saved === 'expanded') ? saved : 'expanded';
  });

  // Persist density preference
  useEffect(() => {
    localStorage.setItem('map-sidebar-density', densityMode);
  }, [densityMode]);

  const toggleDensity = () => {
    setDensityMode(prev => prev === 'compact' ? 'expanded' : 'compact');
  };

  // Pagination state for fullscreen company list
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  
  // Fullscreen tab state - which tab to show in fullscreen mode
  const [fullscreenTab, setFullscreenTab] = useState<'companies' | 'sectors' | 'detail'>('companies');

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Calculate max values for range filters
  const maxTurnover = Math.max(...companies.map(c => c.turnover || 0));
  const maxEmployees = Math.max(...companies.map(c => c.employees || 0));

  const [turnoverRange, setTurnoverRange] = useState<[number, number]>([0, maxTurnover]);
  const [employeeRange, setEmployeeRange] = useState<[number, number]>([0, maxEmployees]);

  // Update ranges when companies change
  useEffect(() => {
    setTurnoverRange([0, maxTurnover]);
    setEmployeeRange([0, maxEmployees]);
  }, [maxTurnover, maxEmployees]);

  useEffect(() => {
    fetchFilterOptions();
  }, [companies]);

  const fetchFilterOptions = async () => {
    // Fetch gestores
    const { data: gestoresData } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    if (gestoresData) setGestores(gestoresData);

    // Get unique parroquias from companies
    const uniqueParroquias = [...new Set(companies.map(c => c.parroquia))].filter(Boolean);
    setParroquias(uniqueParroquias.sort());

    // Get unique CNAEs from companies
    const uniqueCnaes = [...new Set(companies.map(c => c.cnae).filter(Boolean))];
    setCnaes(uniqueCnaes.sort());

    // Get unique sectors from companies
    const uniqueSectors = [...new Set(companies.map(c => c.sector || 'Sin sector'))];
    setSectors(uniqueSectors.sort());
  };

  const filteredCompanies = companies.filter((company) => {
    // Filter by status
    if (filters.statusIds.length > 0 && !filters.statusIds.includes(company.status_id || '')) {
      return false;
    }

    // Filter by gestor
    if (filters.gestorIds.length > 0 && !filters.gestorIds.includes(company.gestor_id || '')) {
      return false;
    }

    // Filter by parroquia
    if (filters.parroquias.length > 0 && !filters.parroquias.includes(company.parroquia)) {
      return false;
    }

    // Filter by sector
    if (filters.sectors.length > 0) {
      // Handle "Sin sector" special case
      if (filters.sectors.includes('Sin sector')) {
        if (!company.sector) return true;
        return filters.sectors.some(s => s === company.sector);
      }
      return filters.sectors.includes(company.sector || '');
    }

    // Filter by products
    if (filters.productIds.length > 0) {
      const companyProductIds = company.products?.map(p => p.id) || [];
      const hasProduct = filters.productIds.some(id => companyProductIds.includes(id));
      if (!hasProduct) return false;
    }

    // Filter by CNAE
    if (filters.cnaes.length > 0 && !filters.cnaes.includes(company.cnae || '')) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange?.from && company.fecha_ultima_visita) {
      const visitDate = new Date(company.fecha_ultima_visita);
      if (visitDate < filters.dateRange.from) return false;
      if (filters.dateRange.to && visitDate > filters.dateRange.to) return false;
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        company.name.toLowerCase().includes(searchLower) ||
        company.address.toLowerCase().includes(searchLower) ||
        company.cnae?.toLowerCase().includes(searchLower) ||
        company.parroquia.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const handleStatusToggle = (statusId: string) => {
    const newStatusIds = filters.statusIds.includes(statusId)
      ? filters.statusIds.filter((id) => id !== statusId)
      : [...filters.statusIds, statusId];
    
    onFiltersChange({ ...filters, statusIds: newStatusIds });
  };

  const handleGestorToggle = (gestorId: string) => {
    const newGestorIds = filters.gestorIds.includes(gestorId)
      ? filters.gestorIds.filter((id) => id !== gestorId)
      : [...filters.gestorIds, gestorId];
    
    onFiltersChange({ ...filters, gestorIds: newGestorIds });
  };

  const handleParroquiaToggle = (parroquia: string) => {
    const newParroquias = filters.parroquias.includes(parroquia)
      ? filters.parroquias.filter((p) => p !== parroquia)
      : [...filters.parroquias, parroquia];
    
    onFiltersChange({ ...filters, parroquias: newParroquias });
  };

  const handleCnaeToggle = (cnae: string) => {
    const newCnaes = filters.cnaes.includes(cnae)
      ? filters.cnaes.filter((c) => c !== cnae)
      : [...filters.cnaes, cnae];
    
    onFiltersChange({ ...filters, cnaes: newCnaes });
  };

  const handleSectorToggle = (sector: string) => {
    const newSectors = filters.sectors.includes(sector)
      ? filters.sectors.filter((s) => s !== sector)
      : [...filters.sectors, sector];
    
    onFiltersChange({ ...filters, sectors: newSectors });
  };

  const handleProductToggle = (productId: string) => {
    const newProductIds = filters.productIds.includes(productId)
      ? filters.productIds.filter((id) => id !== productId)
      : [...filters.productIds, productId];
    
    onFiltersChange({ ...filters, productIds: newProductIds });
  };

  const clearFilters = () => {
    onFiltersChange({
      statusIds: [],
      gestorIds: [],
      parroquias: [],
      cnaes: [],
      sectors: [],
      productIds: [],
      dateRange: null,
      searchTerm: '',
      vinculacionRange: { min: 0, max: 100 },
      facturacionRange: { min: 0, max: 10000000 },
      plBancoRange: { min: -1000000, max: 1000000 },
      beneficiosRange: { min: -1000000, max: 1000000 },
    });
  };

  const handleSectorClick = (sector: string) => {
    const newSectors = filters.sectors.includes(sector)
      ? filters.sectors.filter((s) => s !== sector)
      : [...filters.sectors, sector];
    
    onFiltersChange({ ...filters, sectors: newSectors });
  };

  const handleSelectAllSectors = () => {
    const allSectors = Array.from(
      new Set(companies.map((c) => c.sector || 'Sin sector'))
    );
    onFiltersChange({ ...filters, sectors: allSectors });
  };

  const handleClearSectorSelection = () => {
    onFiltersChange({ ...filters, sectors: [] });
  };

  const handleInvertSectorSelection = () => {
    const allSectors = Array.from(
      new Set(companies.map((c) => c.sector || 'Sin sector'))
    );
    const newSectors = allSectors.filter((s) => !filters.sectors.includes(s));
    onFiltersChange({ ...filters, sectors: newSectors });
  };

  const hasActiveFilters = 
    filters.statusIds.length > 0 ||
    filters.gestorIds.length > 0 ||
    filters.parroquias.length > 0 ||
    filters.cnaes.length > 0 ||
    filters.sectors.length > 0 ||
    filters.productIds.length > 0 ||
    filters.dateRange !== null ||
    filters.searchTerm !== '';

  const getActiveFiltersCount = () => {
    return filters.statusIds.length + 
           filters.gestorIds.length + 
           filters.parroquias.length + 
           filters.cnaes.length + 
           filters.sectors.length +
           filters.productIds.length + 
           (filters.dateRange ? 1 : 0);
  };

  if (!open) return null;

  // Calculate pagination
  const totalPages = Math.ceil(filteredCompanies.length / pageSize);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Tab navigation component for fullscreen mode
  const FullscreenTabNav = () => (
    <div className="flex items-center justify-between gap-2 px-6 py-3 border-b bg-muted/20">
      <div className="flex items-center gap-2">
        <Button
          variant={fullscreenTab === 'companies' ? 'default' : 'outline'}
          onClick={() => setFullscreenTab('companies')}
          className={cn(
            "font-bold tracking-wide transition-all duration-200",
            "hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg"
          )}
          style={{ textShadow: fullscreenTab === 'companies' ? '1px 1px 2px rgba(0,0,0,0.2)' : 'none' }}
        >
          <Search className="h-4 w-4 mr-2 drop-shadow-md" />
          Empresas
        </Button>
        <Button
          variant={fullscreenTab === 'sectors' ? 'default' : 'outline'}
          onClick={() => setFullscreenTab('sectors')}
          className={cn(
            "font-bold tracking-wide transition-all duration-200",
            "hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg"
          )}
          style={{ textShadow: fullscreenTab === 'sectors' ? '1px 1px 2px rgba(0,0,0,0.2)' : 'none' }}
        >
          <TrendingUp className="h-4 w-4 mr-2 drop-shadow-md" />
          Sectores
        </Button>
        <Button
          variant={fullscreenTab === 'detail' ? 'default' : 'outline'}
          onClick={() => setFullscreenTab('detail')}
          className={cn(
            "font-bold tracking-wide transition-all duration-200",
            "hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg"
          )}
          style={{ textShadow: fullscreenTab === 'detail' ? '1px 1px 2px rgba(0,0,0,0.2)' : 'none' }}
        >
          <Building className="h-4 w-4 mr-2 drop-shadow-md" />
          Detalle
        </Button>
      </div>
      
      {/* Selected company indicator with clear button */}
      {selectedCompany && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
          <Building className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium truncate max-w-[200px]">{selectedCompany.name}</span>
          {selectedCompany.status && (
            <Badge 
              style={{ backgroundColor: selectedCompany.status.color_hex }}
              className="text-white text-xs"
            >
              {selectedCompany.status.status_name}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectCompany(null)}
            className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  // Pagination component
  const PaginationControls = () => (
    <div className="flex items-center justify-center gap-2 py-4 border-t bg-muted/10">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className="h-8 px-2"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className="h-8 px-2"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium px-3">
        Página {currentPage} de {totalPages || 1}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage >= totalPages}
        className="h-8 px-2"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage >= totalPages}
        className="h-8 px-2"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground ml-4">
        Mostrando {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredCompanies.length)} de {filteredCompanies.length}
      </span>
    </div>
  );

  // Unified fullscreen mode
  if (fullscreen) {
    // Use fullscreenTab directly - company selection persists across tabs
    const activeTab = fullscreenTab;
    
    return (
      <aside 
        className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] border-0 bg-card shadow-xl flex flex-col animate-in duration-300"
        style={{ position: 'fixed', width: '100vw', height: '100vh', top: 0, left: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-muted/30 shrink-0 px-6 py-4">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">
              {activeTab === 'companies' && 'Panel de Empresas'}
              {activeTab === 'sectors' && 'Análisis de Sectores'}
              {activeTab === 'detail' && 'Detalle de Empresa'}
            </span>
            {activeTab === 'companies' && hasActiveFilters && (
              <Badge variant="default" className="h-6 px-2">
                {getActiveFiltersCount()} filtros
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'companies' && hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-destructive px-3"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
            {onFullscreenChange && (
              <Button
                variant="default"
                onClick={() => onFullscreenChange(false)}
                className="px-4"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Volver al Mapa
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <FullscreenTabNav />

        {/* Content based on active tab */}
        {activeTab === 'companies' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="shrink-0 px-6 py-4 border-b">
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresas..."
                  value={filters.searchTerm}
                  onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
                  className="pl-10 h-10"
                />
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Badge variant="outline">{filteredCompanies.length} empresas</Badge>
                {hasActiveFilters && (
                  <span>con {getActiveFiltersCount()} filtros activos</span>
                )}
              </div>
            </div>

            {/* Full content area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Stats Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border">
                  <div className="text-3xl font-bold">{companies.length}</div>
                  <div className="text-sm text-muted-foreground">Total empresas</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border">
                  <div className="text-3xl font-bold">{filteredCompanies.length}</div>
                  <div className="text-sm text-muted-foreground">Filtradas</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border">
                  <div className="text-3xl font-bold">{sectors.length}</div>
                  <div className="text-sm text-muted-foreground">Sectores</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border">
                  <div className="text-3xl font-bold">{gestores.length}</div>
                  <div className="text-sm text-muted-foreground">Gestores</div>
                </div>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {/* Column 1: Estado y Gestor */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">Estado</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {statusColors.map((status) => (
                        <div key={status.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`fs-status-${status.id}`}
                            checked={filters.statusIds.includes(status.id)}
                            onCheckedChange={() => handleStatusToggle(status.id)}
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor={`fs-status-${status.id}`}
                            className="flex items-center gap-1.5 text-sm cursor-pointer"
                          >
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: status.color_hex }}
                            />
                            <span className="truncate">{status.status_name}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">Gestor</h3>
                    </div>
                    <ScrollArea className="h-40">
                      <div className="grid grid-cols-2 gap-2 pr-3">
                        {gestores.map((gestor) => (
                          <div key={gestor.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`fs-gestor-${gestor.id}`}
                              checked={filters.gestorIds.includes(gestor.id)}
                              onCheckedChange={() => handleGestorToggle(gestor.id)}
                              className="h-4 w-4"
                            />
                            <label
                              htmlFor={`fs-gestor-${gestor.id}`}
                              className="text-sm cursor-pointer truncate"
                            >
                              {gestor.full_name || gestor.email}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {/* Column 2: Ubicación */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">Parroquia</h3>
                    </div>
                    <ScrollArea className="h-40">
                      <div className="grid grid-cols-2 gap-2 pr-3">
                        {parroquias.map((parroquia) => (
                          <div key={parroquia} className="flex items-center space-x-2">
                            <Checkbox
                              id={`fs-parroquia-${parroquia}`}
                              checked={filters.parroquias.includes(parroquia)}
                              onCheckedChange={() => handleParroquiaToggle(parroquia)}
                              className="h-4 w-4"
                            />
                            <label
                              htmlFor={`fs-parroquia-${parroquia}`}
                              className="text-sm cursor-pointer truncate"
                            >
                              {parroquia}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">Sector</h3>
                    </div>
                    <ScrollArea className="h-40">
                      <div className="grid grid-cols-2 gap-2 pr-3">
                        {sectors.map((sector) => (
                          <div key={sector} className="flex items-center space-x-2">
                            <Checkbox
                              id={`fs-sector-${sector}`}
                              checked={filters.sectors.includes(sector)}
                              onCheckedChange={() => handleSectorToggle(sector)}
                              className="h-4 w-4"
                            />
                            <label
                              htmlFor={`fs-sector-${sector}`}
                              className="text-sm cursor-pointer truncate"
                            >
                              {sector}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {/* Column 3: Productos */}
                <div className="p-4 rounded-lg border bg-card h-fit">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Productos</h3>
                  </div>
                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-2 gap-2 pr-3">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`fs-product-${product.id}`}
                            checked={filters.productIds.includes(product.id)}
                            onCheckedChange={() => handleProductToggle(product.id)}
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor={`fs-product-${product.id}`}
                            className="text-sm cursor-pointer truncate"
                          >
                            {product.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Column 4: Valores Numéricos */}
                <div className="p-4 rounded-lg border bg-card h-fit">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Valores Numéricos</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">% Vinculación</span>
                        <span className="text-xs font-medium">
                          {filters?.vinculacionRange?.min || 0}% - {filters?.vinculacionRange?.max || 100}%
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[filters?.vinculacionRange?.min || 0, filters?.vinculacionRange?.max || 100]}
                        onValueChange={(value) =>
                          onFiltersChange({
                            ...filters,
                            vinculacionRange: { min: value[0], max: value[1] },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Facturación</span>
                        <span className="text-xs font-medium">
                          {((filters?.facturacionRange?.min || 0) / 1000000).toFixed(1)}M - {((filters?.facturacionRange?.max || 10000000) / 1000000).toFixed(1)}M €
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={10000000}
                        step={100000}
                        value={[filters?.facturacionRange?.min || 0, filters?.facturacionRange?.max || 10000000]}
                        onValueChange={(value) =>
                          onFiltersChange({
                            ...filters,
                            facturacionRange: { min: value[0], max: value[1] },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">P&L Banco</span>
                        <span className="text-xs font-medium">
                          {((filters?.plBancoRange?.min || -1000000) / 1000).toFixed(0)}k - {((filters?.plBancoRange?.max || 1000000) / 1000).toFixed(0)}k €
                        </span>
                      </div>
                      <Slider
                        min={-1000000}
                        max={1000000}
                        step={50000}
                        value={[filters?.plBancoRange?.min || -1000000, filters?.plBancoRange?.max || 1000000]}
                        onValueChange={(value) =>
                          onFiltersChange({
                            ...filters,
                            plBancoRange: { min: value[0], max: value[1] },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Resultados ({filteredCompanies.length})</h3>
                </div>
                <div className="grid grid-cols-5 gap-3">
                {paginatedCompanies.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => onSelectCompany(company)}
                      className={cn(
                        "p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/30 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md",
                        selectedCompany?.id === company.id && "ring-2 ring-primary border-primary bg-primary/10 shadow-lg scale-[1.02]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{company.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{company.parroquia}</div>
                        </div>
                        {company.status && (
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
                            style={{ backgroundColor: company.status.color_hex }}
                          />
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {company.vinculacion_entidad_1 != null && (
                          <Badge variant="outline" className="text-xs">
                            {company.vinculacion_entidad_1}% vinc.
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && <PaginationControls />}
          </div>
        )}

        {activeTab === 'sectors' && (
          <div className="flex-1 overflow-y-auto p-6">
            <SectorStats
              companies={filteredCompanies}
              onSectorClick={handleSectorClick}
              selectedSectors={filters.sectors}
              onSelectAll={handleSelectAllSectors}
              onClearSelection={handleClearSectorSelection}
              onInvertSelection={handleInvertSectorSelection}
              turnoverRange={turnoverRange}
              employeeRange={employeeRange}
              onTurnoverRangeChange={setTurnoverRange}
              onEmployeeRangeChange={setEmployeeRange}
            />
          </div>
        )}

        {activeTab === 'detail' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedCompany ? (
              <>
                {/* Navigation controls */}
                <div className="shrink-0 px-6 py-3 border-b bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentIndex = filteredCompanies.findIndex(c => c.id === selectedCompany.id);
                        if (currentIndex > 0) {
                          onSelectCompany(filteredCompanies[currentIndex - 1]);
                        }
                      }}
                      disabled={filteredCompanies.findIndex(c => c.id === selectedCompany.id) <= 0}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {filteredCompanies.findIndex(c => c.id === selectedCompany.id) + 1} de {filteredCompanies.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentIndex = filteredCompanies.findIndex(c => c.id === selectedCompany.id);
                        if (currentIndex < filteredCompanies.length - 1) {
                          onSelectCompany(filteredCompanies[currentIndex + 1]);
                        }
                      }}
                      disabled={filteredCompanies.findIndex(c => c.id === selectedCompany.id) >= filteredCompanies.length - 1}
                      className="h-8 px-3"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentIndex = filteredCompanies.findIndex(c => c.id === selectedCompany.id);
                        setCurrentPage(Math.floor(currentIndex / pageSize) + 1);
                        setFullscreenTab('companies');
                      }}
                      className="h-8 px-3"
                    >
                      <Search className="h-4 w-4 mr-1" />
                      Ver en lista
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <CompanyDetail
                    company={selectedCompany} 
                    onClose={() => onSelectCompany(null)}
                    defaultTab={(selectedCompany as any)._openMediaTab ? "media" : "info"}
                    densityMode="expanded"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                  <Building className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Sin empresa seleccionada</p>
                  <p className="text-sm mt-2 opacity-70">
                    Selecciona una empresa de la lista o del mapa para ver sus detalles
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setFullscreenTab('companies')}
                    className="mt-4"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Ir a lista de empresas
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside 
      className={cn(
        "bg-card shadow-xl flex flex-col animate-in duration-300",
        fullscreen 
          ? "fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] border-0" 
          : "w-[380px] h-full border-l shrink-0 z-10 slide-in-from-right"
      )}
      style={fullscreen ? { position: 'fixed', width: '100vw', height: '100vh', top: 0, left: 0 } : undefined}
    >
      {/* Header - Different style for fullscreen */}
      <div className={cn(
        "flex items-center justify-between border-b bg-muted/30 shrink-0",
        fullscreen ? "px-6 py-4" : "px-3 py-2"
      )}>
          <div className="flex items-center gap-3">
            <Building className={cn("text-primary", fullscreen ? "h-6 w-6" : "h-4 w-4")} />
            <span className={cn("font-semibold", fullscreen ? "text-lg" : "text-sm")}>
              {fullscreen ? "Panel de Empresas" : "Panel"}
            </span>
            {hasActiveFilters && (
              <Badge variant="default" className={cn(fullscreen ? "h-6 px-2" : "h-5 px-1.5 text-xs")}>
                {getActiveFiltersCount()} filtros
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size={fullscreen ? "default" : "sm"}
                onClick={clearFilters}
                className={cn(
                  "text-muted-foreground hover:text-destructive",
                  fullscreen ? "px-3" : "h-7 px-2 text-xs"
                )}
              >
                <X className={cn(fullscreen ? "h-4 w-4" : "h-3 w-3", "mr-1")} />
                Limpiar filtros
              </Button>
            )}
            {!fullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDensity}
                className={cn(
                  "h-7 w-7 p-0 transition-all",
                  densityMode === 'compact' && "bg-primary/10 text-primary"
                )}
                title={densityMode === 'compact' ? "Expandir" : "Compactar"}
              >
                {densityMode === 'compact' ? (
                  <Maximize2 className="h-3.5 w-3.5" />
                ) : (
                  <Minimize2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            {onFullscreenChange && (
              <Button
                variant={fullscreen ? "default" : "ghost"}
                size={fullscreen ? "default" : "sm"}
                onClick={() => onFullscreenChange(!fullscreen)}
                className={cn(
                  fullscreen ? "px-4" : "h-7 px-2 text-xs"
                )}
              >
                {fullscreen ? (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Volver al Mapa
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5 mr-1" />
                    Expandir
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs Navigation - Hidden in fullscreen */}
        <Tabs 
          defaultValue="companies"
          className="flex-1 flex flex-col overflow-hidden"
        >
          {!fullscreen && (
            <>
              <TabsList className="mx-2 mt-2 grid grid-cols-3 h-10 bg-muted/50 shrink-0 gap-1 p-1">
                <TabsTrigger 
                  value="companies" 
                  className={cn(
                    "text-sm font-bold tracking-wide rounded-md transition-all duration-200 ease-out",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg",
                    "hover:scale-105 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20",
                    "data-[state=active]:scale-105 data-[state=active]:-translate-y-0.5"
                  )}
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}
                >
                  <Search className="h-4 w-4 mr-1.5 drop-shadow-md transition-transform duration-200" />
                  Empresas
                </TabsTrigger>
                <TabsTrigger 
                  value="sectors" 
                  className={cn(
                    "text-sm font-bold tracking-wide rounded-md transition-all duration-200 ease-out",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg",
                    "hover:scale-105 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20",
                    "data-[state=active]:scale-105 data-[state=active]:-translate-y-0.5"
                  )}
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}
                >
                  <TrendingUp className="h-4 w-4 mr-1.5 drop-shadow-md transition-transform duration-200" />
                  Sectores
                </TabsTrigger>
                <TabsTrigger 
                  value="detail" 
                  className={cn(
                    "text-sm font-bold tracking-wide rounded-md transition-all duration-200 ease-out",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg",
                    "hover:scale-105 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20",
                    "data-[state=active]:scale-105 data-[state=active]:-translate-y-0.5"
                  )}
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}
                >
                  <Building className="h-4 w-4 mr-1.5 drop-shadow-md transition-transform duration-200" />
                  Detalle
                </TabsTrigger>
              </TabsList>
              
              {/* Selected company indicator with clear button - visible in all tabs */}
              {selectedCompany && (
                <div className="mx-2 mt-2 flex items-center gap-2 px-2 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                  <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-medium truncate flex-1">{selectedCompany.name}</span>
                  {selectedCompany.status && (
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: selectedCompany.status.color_hex }}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectCompany(null)}
                    className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive shrink-0"
                    title="Limpiar selección"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Companies Tab */}
          <TabsContent value="companies" className="flex-1 flex flex-col mt-0 overflow-hidden">
            {/* Search */}
            <div className={cn("shrink-0", fullscreen ? "px-4 py-3" : "px-2 py-2")}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresas..."
                  value={filters.searchTerm}
                  onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
                  className={cn("pl-8 text-sm", fullscreen ? "h-10" : "h-8")}
                />
              </div>
              {fullscreen && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{filteredCompanies.length} empresas</Badge>
                  {hasActiveFilters && (
                    <span>con {getActiveFiltersCount()} filtros activos</span>
                  )}
                </div>
              )}
            </div>

            {/* Content - Different layout for fullscreen */}
            <div className={cn("flex-1", fullscreen ? "overflow-hidden flex flex-col" : "overflow-y-auto")}>
              {fullscreen ? (
                /* Fullscreen Grid Layout */
                <div className="flex-1 p-6 overflow-y-auto">
                  {/* Stats Summary */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border">
                      <div className="text-3xl font-bold">{companies.length}</div>
                      <div className="text-sm text-muted-foreground">Total empresas</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border">
                      <div className="text-3xl font-bold">{filteredCompanies.length}</div>
                      <div className="text-sm text-muted-foreground">Filtradas</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border">
                      <div className="text-3xl font-bold">{sectors.length}</div>
                      <div className="text-sm text-muted-foreground">Sectores</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border">
                      <div className="text-3xl font-bold">{gestores.length}</div>
                      <div className="text-sm text-muted-foreground">Gestores</div>
                    </div>
                  </div>

                  {/* Filters Grid - Horizontal layout for fullscreen */}
                  <div className="grid grid-cols-4 gap-4">
                    {/* Column 1: Estado y Gestor */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-sm">Estado</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {statusColors.map((status) => (
                            <div key={status.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`fs-status-${status.id}`}
                                checked={filters.statusIds.includes(status.id)}
                                onCheckedChange={() => handleStatusToggle(status.id)}
                                className="h-4 w-4"
                              />
                              <label
                                htmlFor={`fs-status-${status.id}`}
                                className="flex items-center gap-1.5 text-sm cursor-pointer"
                              >
                                <div
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: status.color_hex }}
                                />
                                <span className="truncate">{status.status_name}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-sm">Gestor</h3>
                        </div>
                        <ScrollArea className="h-40">
                          <div className="grid grid-cols-2 gap-2 pr-3">
                            {gestores.map((gestor) => (
                              <div key={gestor.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`fs-gestor-${gestor.id}`}
                                  checked={filters.gestorIds.includes(gestor.id)}
                                  onCheckedChange={() => handleGestorToggle(gestor.id)}
                                  className="h-4 w-4"
                                />
                                <label
                                  htmlFor={`fs-gestor-${gestor.id}`}
                                  className="text-sm cursor-pointer truncate"
                                >
                                  {gestor.full_name || gestor.email}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

                    {/* Column 2: Ubicación, Sector, CNAE */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-sm">Parroquia</h3>
                        </div>
                        <ScrollArea className="h-32">
                          <div className="grid grid-cols-2 gap-2 pr-3">
                            {parroquias.map((parroquia) => (
                              <div key={parroquia} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`fs-parroquia-${parroquia}`}
                                  checked={filters.parroquias.includes(parroquia)}
                                  onCheckedChange={() => handleParroquiaToggle(parroquia)}
                                  className="h-4 w-4"
                                />
                                <label
                                  htmlFor={`fs-parroquia-${parroquia}`}
                                  className="text-sm cursor-pointer truncate"
                                >
                                  {parroquia}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-3">
                          <Tag className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-sm">Sector</h3>
                        </div>
                        <ScrollArea className="h-32">
                          <div className="grid grid-cols-2 gap-2 pr-3">
                            {sectors.map((sector) => (
                              <div key={sector} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`fs-sector-${sector}`}
                                  checked={filters.sectors.includes(sector)}
                                  onCheckedChange={() => handleSectorToggle(sector)}
                                  className="h-4 w-4"
                                />
                                <label
                                  htmlFor={`fs-sector-${sector}`}
                                  className="text-sm cursor-pointer truncate"
                                >
                                  {sector}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

                    {/* Column 3: Productos y Valores Numéricos */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-sm">Productos</h3>
                        </div>
                        <ScrollArea className="h-48">
                          <div className="grid grid-cols-2 gap-2 pr-3">
                            {products.map((product) => (
                              <div key={product.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`fs-product-${product.id}`}
                                  checked={filters.productIds.includes(product.id)}
                                  onCheckedChange={() => handleProductToggle(product.id)}
                                  className="h-4 w-4"
                                />
                                <label
                                  htmlFor={`fs-product-${product.id}`}
                                  className="text-sm cursor-pointer truncate"
                                >
                                  {product.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

                    {/* Column 4: Valores Numéricos */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-sm">Valores Numéricos</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">% Vinculación</span>
                              <span className="text-xs font-medium">
                                {filters?.vinculacionRange?.min || 0}% - {filters?.vinculacionRange?.max || 100}%
                              </span>
                            </div>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[filters?.vinculacionRange?.min || 0, filters?.vinculacionRange?.max || 100]}
                              onValueChange={(value) =>
                                onFiltersChange({
                                  ...filters,
                                  vinculacionRange: { min: value[0], max: value[1] },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Facturación</span>
                              <span className="text-xs font-medium">
                                {((filters?.facturacionRange?.min || 0) / 1000000).toFixed(1)}M - {((filters?.facturacionRange?.max || 10000000) / 1000000).toFixed(1)}M €
                              </span>
                            </div>
                            <Slider
                              min={0}
                              max={10000000}
                              step={100000}
                              value={[filters?.facturacionRange?.min || 0, filters?.facturacionRange?.max || 10000000]}
                              onValueChange={(value) =>
                                onFiltersChange({
                                  ...filters,
                                  facturacionRange: { min: value[0], max: value[1] },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">P&L Banco</span>
                              <span className="text-xs font-medium">
                                {((filters?.plBancoRange?.min || -1000000) / 1000).toFixed(0)}k - {((filters?.plBancoRange?.max || 1000000) / 1000).toFixed(0)}k €
                              </span>
                            </div>
                            <Slider
                              min={-1000000}
                              max={1000000}
                              step={50000}
                              value={[filters?.plBancoRange?.min || -1000000, filters?.plBancoRange?.max || 1000000]}
                              onValueChange={(value) =>
                                onFiltersChange({
                                  ...filters,
                                  plBancoRange: { min: value[0], max: value[1] },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filtered Results */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">Resultados ({filteredCompanies.length})</h3>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {filteredCompanies.slice(0, 25).map((company) => (
                        <div
                          key={company.id}
                          onClick={() => onSelectCompany(company)}
                          className={cn(
                            "p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/30 cursor-pointer transition-all",
                            selectedCompany?.id === company.id && "ring-2 ring-primary border-primary bg-primary/10 shadow-lg"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">{company.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{company.parroquia}</div>
                            </div>
                            {company.status && (
                              <div
                                className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
                                style={{ backgroundColor: company.status.color_hex }}
                              />
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            {company.vinculacion_entidad_1 != null && (
                              <Badge variant="outline" className="text-xs">
                                {company.vinculacion_entidad_1}% vinc.
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredCompanies.length > 25 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Mostrando 25 de {filteredCompanies.length} empresas. Usa los filtros para refinar.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Normal Accordion Layout */
                <div className="px-2 pb-2">
                <Accordion type="single" collapsible className="w-full space-y-1">
                  {/* Basic Filters */}
                  <AccordionItem value="basic" className="border rounded-lg px-3">
                    <AccordionTrigger className="py-2.5 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Estado y Gestor</span>
                        {(filters.statusIds.length > 0 || filters.gestorIds.length > 0) && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-auto mr-2">
                            {filters.statusIds.length + filters.gestorIds.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-4">
                        {/* Status */}
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</Label>
                          <div className="mt-2 space-y-1.5">
                            {statusColors.map((status) => (
                              <div key={status.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`status-${status.id}`}
                                  checked={filters.statusIds.includes(status.id)}
                                  onCheckedChange={() => handleStatusToggle(status.id)}
                                  className="h-4 w-4"
                                />
                                <label
                                  htmlFor={`status-${status.id}`}
                                  className="flex items-center gap-2 text-sm cursor-pointer"
                                >
                                  <div
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: status.color_hex }}
                                  />
                                  {status.status_name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Gestores */}
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gestor</Label>
                          <ScrollArea className="mt-2 h-28">
                            <div className="space-y-1.5 pr-3">
                              {gestores.map((gestor) => (
                                <div key={gestor.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`gestor-${gestor.id}`}
                                    checked={filters.gestorIds.includes(gestor.id)}
                                    onCheckedChange={() => handleGestorToggle(gestor.id)}
                                    className="h-4 w-4"
                                  />
                                  <label
                                    htmlFor={`gestor-${gestor.id}`}
                                    className="text-sm cursor-pointer truncate"
                                  >
                                    {gestor.full_name || gestor.email}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Location Filters */}
                  <AccordionItem value="location" className="border rounded-lg px-3">
                    <AccordionTrigger className="py-2.5 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Ubicación</span>
                        {filters.parroquias.length > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-auto mr-2">
                            {filters.parroquias.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Parroquia</Label>
                      <ScrollArea className="mt-2 h-32">
                        <div className="space-y-1.5 pr-3">
                          {parroquias.map((parroquia) => (
                            <div key={parroquia} className="flex items-center space-x-2">
                              <Checkbox
                                id={`parroquia-${parroquia}`}
                                checked={filters.parroquias.includes(parroquia)}
                                onCheckedChange={() => handleParroquiaToggle(parroquia)}
                                className="h-4 w-4"
                              />
                              <label
                                htmlFor={`parroquia-${parroquia}`}
                                className="text-sm cursor-pointer"
                              >
                                {parroquia}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Sector & CNAE */}
                  <AccordionItem value="sector" className="border rounded-lg px-3">
                    <AccordionTrigger className="py-2.5 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Sector y CNAE</span>
                        {(filters.sectors.length > 0 || filters.cnaes.length > 0) && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-auto mr-2">
                            {filters.sectors.length + filters.cnaes.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-4">
                        {/* Sectors */}
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sector</Label>
                          <ScrollArea className="mt-2 h-28">
                            <div className="space-y-1.5 pr-3">
                              {sectors.map((sector) => (
                                <div key={sector} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`sector-${sector}`}
                                    checked={filters.sectors.includes(sector)}
                                    onCheckedChange={() => handleSectorToggle(sector)}
                                    className="h-4 w-4"
                                  />
                                  <label
                                    htmlFor={`sector-${sector}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {sector}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>

                        <Separator />

                        {/* CNAEs */}
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CNAE</Label>
                          <ScrollArea className="mt-2 h-28">
                            <div className="space-y-1.5 pr-3">
                              {cnaes.map((cnae) => (
                                <div key={cnae} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`cnae-${cnae}`}
                                    checked={filters.cnaes.includes(cnae)}
                                    onCheckedChange={() => handleCnaeToggle(cnae)}
                                    className="h-4 w-4"
                                  />
                                  <label
                                    htmlFor={`cnae-${cnae}`}
                                    className="text-sm cursor-pointer truncate"
                                  >
                                    {formatCnaeWithDescription(cnae)}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Products */}
                  <AccordionItem value="products" className="border rounded-lg px-3">
                    <AccordionTrigger className="py-2.5 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Productos</span>
                        {filters.productIds.length > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-auto mr-2">
                            {filters.productIds.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <ScrollArea className="h-32">
                        <div className="space-y-1.5 pr-3">
                          {products.map((product) => (
                            <div key={product.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`product-${product.id}`}
                                checked={filters.productIds.includes(product.id)}
                                onCheckedChange={() => handleProductToggle(product.id)}
                                className="h-4 w-4"
                              />
                              <label
                                htmlFor={`product-${product.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {product.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Numeric Filters */}
                  <AccordionItem value="numeric" className="border rounded-lg px-3">
                    <AccordionTrigger className="py-2.5 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Valores Numéricos</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-4">
                        {/* Vinculación */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">% Vinculación</Label>
                            <span className="text-xs text-muted-foreground">
                              {filters?.vinculacionRange?.min || 0}% - {filters?.vinculacionRange?.max || 100}%
                            </span>
                          </div>
                          <Slider
                            min={0}
                            max={100}
                            step={5}
                            value={[filters?.vinculacionRange?.min || 0, filters?.vinculacionRange?.max || 100]}
                            onValueChange={(value) =>
                              onFiltersChange({
                                ...filters,
                                vinculacionRange: { min: value[0], max: value[1] },
                              })
                            }
                            className="w-full"
                          />
                        </div>

                        {/* Facturación */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Facturación</Label>
                            <span className="text-xs text-muted-foreground">
                              {((filters?.facturacionRange?.min || 0) / 1000000).toFixed(1)}M - {((filters?.facturacionRange?.max || 10000000) / 1000000).toFixed(1)}M €
                            </span>
                          </div>
                          <Slider
                            min={0}
                            max={10000000}
                            step={100000}
                            value={[filters?.facturacionRange?.min || 0, filters?.facturacionRange?.max || 10000000]}
                            onValueChange={(value) =>
                              onFiltersChange({
                                ...filters,
                                facturacionRange: { min: value[0], max: value[1] },
                              })
                            }
                            className="w-full"
                          />
                        </div>

                        {/* P&L Banco */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">P&L Banco</Label>
                            <span className="text-xs text-muted-foreground">
                              {((filters?.plBancoRange?.min || -1000000) / 1000).toFixed(0)}k - {((filters?.plBancoRange?.max || 1000000) / 1000).toFixed(0)}k €
                            </span>
                          </div>
                          <Slider
                            min={-1000000}
                            max={1000000}
                            step={50000}
                            value={[filters?.plBancoRange?.min || -1000000, filters?.plBancoRange?.max || 1000000]}
                            onValueChange={(value) =>
                              onFiltersChange({
                                ...filters,
                                plBancoRange: { min: value[0], max: value[1] },
                              })
                            }
                            className="w-full"
                          />
                        </div>

                        {/* Beneficios */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Beneficios</Label>
                            <span className="text-xs text-muted-foreground">
                              {((filters?.beneficiosRange?.min || -1000000) / 1000).toFixed(0)}k - {((filters?.beneficiosRange?.max || 1000000) / 1000).toFixed(0)}k €
                            </span>
                          </div>
                          <Slider
                            min={-1000000}
                            max={1000000}
                            step={50000}
                            value={[filters?.beneficiosRange?.min || -1000000, filters?.beneficiosRange?.max || 1000000]}
                            onValueChange={(value) =>
                              onFiltersChange({
                                ...filters,
                                beneficiosRange: { min: value[0], max: value[1] },
                              })
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Date Filter */}
                  <AccordionItem value="date" className="border rounded-lg px-3">
                    <AccordionTrigger className="py-2.5 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Última Visita</span>
                        {filters.dateRange && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-auto mr-2">
                            1
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-sm">
                            <Calendar className="mr-2 h-4 w-4" />
                            {filters.dateRange?.from ? (
                              filters.dateRange.to ? (
                                <>
                                  {format(filters.dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
                                  {format(filters.dateRange.to, "dd MMM yyyy", { locale: es })}
                                </>
                              ) : (
                                format(filters.dateRange.from, "dd MMM yyyy", { locale: es })
                              )
                            ) : (
                              <span className="text-muted-foreground">Seleccionar rango</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="range"
                            selected={{
                              from: filters.dateRange?.from || undefined,
                              to: filters.dateRange?.to || undefined,
                            }}
                            onSelect={(range) => {
                              onFiltersChange({
                                ...filters,
                                dateRange: range ? { from: range.from || null, to: range.to || null } : null,
                              });
                            }}
                            locale={es}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Companies List - Only show when searching */}
                {filters.searchTerm ? (
                  <>
                    <div className="mt-4 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">Resultados</h3>
                        <Badge variant="outline" className="h-5 px-1.5 text-xs">
                          {filteredCompanies.length}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      {filteredCompanies.slice(0, 20).map((company) => (
                        <button
                          key={company.id}
                          onClick={() => onSelectCompany(company)}
                          className={cn(
                            'w-full rounded-lg border p-2.5 text-left transition-all hover:bg-accent hover:border-primary/30',
                            selectedCompany?.id === company.id && 'border-primary bg-primary/5 shadow-sm'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: company.status?.color_hex || '#gray' }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-sm">{company.name}</p>
                              <p className="truncate text-xs text-muted-foreground mt-0.5">
                                {company.address}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{company.parroquia}</span>
                                {company.vinculacion_entidad_1 !== null && (
                                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                                    {company.vinculacion_entidad_1}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      ))}

                      {filteredCompanies.length === 0 && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          No se encontraron empresas
                        </div>
                      )}
                      
                      {filteredCompanies.length > 20 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Mostrando 20 de {filteredCompanies.length} resultados
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="mt-6 py-8 text-center text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Busca una empresa</p>
                    <p className="text-xs mt-1 opacity-70">
                      Escribe en el buscador o usa los filtros
                    </p>
                  </div>
                )}
              </div>
              )}
            </div>
          </TabsContent>

          {/* Sectors Tab */}
          <TabsContent value="sectors" className="flex-1 mt-0 overflow-y-auto">
            <div className="p-2">
              <SectorStats
                companies={filteredCompanies}
                onSectorClick={handleSectorClick}
                selectedSectors={filters.sectors}
                onSelectAll={handleSelectAllSectors}
                onClearSelection={handleClearSectorSelection}
                onInvertSelection={handleInvertSectorSelection}
                turnoverRange={turnoverRange}
                employeeRange={employeeRange}
                onTurnoverRangeChange={setTurnoverRange}
                onEmployeeRangeChange={setEmployeeRange}
              />
            </div>
          </TabsContent>

          {/* Detail Tab */}
          <TabsContent value="detail" className="flex-1 flex flex-col mt-0 overflow-hidden">
            {selectedCompany ? (
              <>
                {/* Navigation controls - compact for sidebar */}
                <div className="shrink-0 px-2 py-2 border-b bg-muted/20 flex items-center justify-between gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentIndex = filteredCompanies.findIndex(c => c.id === selectedCompany.id);
                      if (currentIndex > 0) {
                        onSelectCompany(filteredCompanies[currentIndex - 1]);
                      }
                    }}
                    disabled={filteredCompanies.findIndex(c => c.id === selectedCompany.id) <= 0}
                    className="h-7 px-2 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {filteredCompanies.findIndex(c => c.id === selectedCompany.id) + 1} / {filteredCompanies.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentIndex = filteredCompanies.findIndex(c => c.id === selectedCompany.id);
                      if (currentIndex < filteredCompanies.length - 1) {
                        onSelectCompany(filteredCompanies[currentIndex + 1]);
                      }
                    }}
                    disabled={filteredCompanies.findIndex(c => c.id === selectedCompany.id) >= filteredCompanies.length - 1}
                    className="h-7 px-2 text-xs"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <CompanyDetail
                    company={selectedCompany} 
                    onClose={() => onSelectCompany(null)}
                    defaultTab={(selectedCompany as any)._openMediaTab ? "media" : "info"}
                    densityMode={densityMode}
                  />
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <Building className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Sin selección</p>
                <p className="text-xs mt-1 opacity-70">
                  Selecciona una empresa del mapa o lista
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
    </aside>
  );
}
