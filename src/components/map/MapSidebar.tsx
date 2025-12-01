import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CompanyWithDetails, MapFilters, StatusColor, Product, Profile } from '@/types/database';
import { Search, X, Calendar, TrendingUp, Building, Maximize2, Minimize2, Users, MapPin, Package, Tag, DollarSign, ChevronRight } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

  return (
    <aside className="absolute right-0 top-0 z-10 h-full w-[380px] border-l bg-card shadow-xl lg:relative animate-in slide-in-from-right duration-300">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Panel de Datos</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasActiveFilters && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Limpiar filtros</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleDensity}
                    className={cn(
                      "h-7 w-7 p-0 transition-all",
                      densityMode === 'compact' && "bg-primary/10 text-primary"
                    )}
                  >
                    {densityMode === 'compact' ? (
                      <Maximize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Minimize2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {densityMode === 'compact' ? 'Vista expandida' : 'Vista compacta'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Tabs 
          value={selectedCompany ? "detail" : "companies"} 
          onValueChange={(value) => {
            if (value !== "detail") {
              onSelectCompany(null);
            }
          }}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <TabsList className={cn(
            "mx-3 grid grid-cols-3 shrink-0 bg-muted/50",
            densityMode === 'compact' ? "mt-2 h-8" : "mt-3 h-9"
          )}>
            <TabsTrigger 
              value="companies" 
              className={cn(
                "flex items-center gap-1.5",
                densityMode === 'compact' ? "text-xs" : "text-sm"
              )}
            >
              <Search className="h-3.5 w-3.5" />
              Empresas
            </TabsTrigger>
            <TabsTrigger 
              value="sectors" 
              className={cn(
                "flex items-center gap-1.5",
                densityMode === 'compact' ? "text-xs" : "text-sm"
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Sectores
            </TabsTrigger>
            <TabsTrigger 
              value="detail" 
              className={cn(
                "flex items-center gap-1.5",
                densityMode === 'compact' ? "text-xs" : "text-sm"
              )}
            >
              <Building className="h-3.5 w-3.5" />
              Detalle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden">
            {/* Search */}
            <div className="px-3 py-2.5 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresas..."
                  value={filters.searchTerm}
                  onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Filters Accordion */}
            <ScrollArea className="flex-1">
              <div className="p-3">
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

                {/* Companies List Header */}
                <div className="mt-4 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Empresas</h3>
                    <Badge variant="outline" className="h-5 px-1.5 text-xs">
                      {filteredCompanies.length}
                    </Badge>
                  </div>
                </div>
                
                {/* Companies List */}
                <div className="space-y-1.5">
                  {filteredCompanies.map((company) => (
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
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sectors" className="flex-1 flex flex-col mt-0 min-h-0 overflow-y-auto p-3">
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
          </TabsContent>

          <TabsContent value="detail" className="flex-1 flex flex-col m-0 p-0 min-h-0 overflow-hidden">
            {selectedCompany ? (
              <CompanyDetail
                company={selectedCompany} 
                onClose={() => onSelectCompany(null)}
                defaultTab={(selectedCompany as any)._openMediaTab ? "media" : "info"}
                densityMode={densityMode}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center">
                <div>
                  <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No hay empresa seleccionada</p>
                  <p className="text-xs mt-1 text-muted-foreground/70">
                    Selecciona una empresa del mapa o de la lista
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}
