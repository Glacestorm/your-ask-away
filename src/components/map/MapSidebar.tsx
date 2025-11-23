import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CompanyWithDetails, MapFilters, StatusColor, Product, Profile } from '@/types/database';
import { Search, X, Filter, Calendar, History, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { VisitsPanel } from './VisitsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectorStats } from './SectorStats';
import { formatCnaeWithDescription } from '@/lib/cnaeDescriptions';

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
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [parroquias, setParroquias] = useState<string[]>([]);
  const [cnaes, setCnaes] = useState<string[]>([]);

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
    });
  };

  const handleSectorClick = (sector: string) => {
    // If clicking on "Sin sector", filter for companies without sector
    const sectorValue = sector === 'Sin sector' ? null : sector;
    
    // Toggle sector selection
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

  if (!open) return null;

  return (
    <aside
      className="absolute left-0 top-0 z-10 h-full w-96 border-r bg-card shadow-lg lg:relative"
    >
      <div className="flex h-full flex-col">
        <Tabs defaultValue="companies" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 grid grid-cols-3">
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Empresas</span>
            </TabsTrigger>
            <TabsTrigger value="sectors" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Sectores</span>
            </TabsTrigger>
            <TabsTrigger value="visits" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Visitas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="flex-1 flex flex-col mt-0">
            {/* Search */}
            <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar empresas..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterExpanded(!filterExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                  {filters.statusIds.length + filters.gestorIds.length + filters.parroquias.length + 
                   filters.cnaes.length + filters.productIds.length + (filters.dateRange ? 1 : 0)}
                </Badge>
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {filterExpanded && (
            <div className="mt-4 space-y-4">
              <div>
                <Label className="mb-2 text-sm font-medium">Estado</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {statusColors.map((status) => (
                      <div key={status.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status.id}`}
                          checked={filters.statusIds.includes(status.id)}
                          onCheckedChange={() => handleStatusToggle(status.id)}
                        />
                        <label
                          htmlFor={`status-${status.id}`}
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: status.color_hex }}
                          />
                          {status.status_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              <div>
                <Label className="mb-2 text-sm font-medium">Gestor</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {gestores.map((gestor) => (
                      <div key={gestor.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`gestor-${gestor.id}`}
                          checked={filters.gestorIds.includes(gestor.id)}
                          onCheckedChange={() => handleGestorToggle(gestor.id)}
                        />
                        <label
                          htmlFor={`gestor-${gestor.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {gestor.full_name || gestor.email}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              <div>
                <Label className="mb-2 text-sm font-medium">Parroquia</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {parroquias.map((parroquia) => (
                      <div key={parroquia} className="flex items-center space-x-2">
                        <Checkbox
                          id={`parroquia-${parroquia}`}
                          checked={filters.parroquias.includes(parroquia)}
                          onCheckedChange={() => handleParroquiaToggle(parroquia)}
                        />
                        <label
                          htmlFor={`parroquia-${parroquia}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {parroquia}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              <div>
                <Label className="mb-2 text-sm font-medium">CNAE</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {cnaes.map((cnae) => (
                      <div key={cnae} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cnae-${cnae}`}
                          checked={filters.cnaes.includes(cnae)}
                          onCheckedChange={() => handleCnaeToggle(cnae)}
                        />
                        <label
                          htmlFor={`cnae-${cnae}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {formatCnaeWithDescription(cnae)}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              <div>
                <Label className="mb-2 text-sm font-medium">Productos</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={filters.productIds.includes(product.id)}
                          onCheckedChange={() => handleProductToggle(product.id)}
                        />
                        <label
                          htmlFor={`product-${product.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {product.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              <div>
                <Label className="mb-2 text-sm font-medium">Última Visita</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                        <span>Seleccionar fecha</span>
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
              </div>
            </div>
          )}
        </div>

            {/* Companies List */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    Empresas ({filteredCompanies.length})
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => onSelectCompany(company)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent',
                        selectedCompany?.id === company.id && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: company.status?.color_hex || '#gray' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-sm">{company.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {company.address}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {company.parroquia}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {filteredCompanies.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No se encontraron empresas
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sectors" className="flex-1 p-4">
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

          <TabsContent value="visits" className="flex-1 p-4">
            <VisitsPanel company={selectedCompany} />
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}
