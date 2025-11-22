import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CompanyWithDetails, MapFilters, StatusColor, Product } from '@/types/database';
import { Search, X, Filter, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  const filteredCompanies = companies.filter((company) => {
    // Filter by status
    if (filters.statusIds.length > 0 && !filters.statusIds.includes(company.status_id || '')) {
      return false;
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

  const clearFilters = () => {
    onFiltersChange({
      statusIds: [],
      gestorIds: [],
      parroquias: [],
      cnaes: [],
      productIds: [],
      dateRange: null,
      searchTerm: '',
    });
  };

  const hasActiveFilters = 
    filters.statusIds.length > 0 ||
    filters.gestorIds.length > 0 ||
    filters.parroquias.length > 0 ||
    filters.cnaes.length > 0 ||
    filters.productIds.length > 0 ||
    filters.dateRange !== null ||
    filters.searchTerm !== '';

  return (
    <aside
      className={cn(
        'absolute left-0 top-0 z-10 h-full w-80 transform border-r bg-card shadow-lg transition-transform duration-300 lg:relative lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex h-full flex-col">
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
                  {filters.statusIds.length}
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
      </div>
    </aside>
  );
}
