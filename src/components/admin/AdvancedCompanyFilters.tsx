import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Filter, X, ChevronDown } from 'lucide-react';
import { StatusColor, Profile } from '@/types/database';

interface AdvancedFilters {
  status?: string;
  gestor?: string;
  parroquia?: string;
  oficina?: string;
  clientType?: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasGeolocalization?: boolean;
  minVinculacion?: number;
  maxVinculacion?: number;
  minEmployees?: number;
  maxEmployees?: number;
  minTurnover?: number;
  maxTurnover?: number;
}

interface AdvancedCompanyFiltersProps {
  statusColors: StatusColor[];
  gestores: Profile[];
  parroquias: string[];
  oficinas: string[];
  onFiltersChange: (filters: AdvancedFilters) => void;
}

export function AdvancedCompanyFilters({
  statusColors,
  gestores,
  parroquias,
  oficinas,
  onFiltersChange,
}: AdvancedCompanyFiltersProps) {
  const [filters, setFilters] = useState<AdvancedFilters>({});
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof AdvancedFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (value === undefined || value === '' || value === 'all') {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros Avanzados
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Filtros Avanzados</h4>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => updateFilter('status', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {statusColors.map(status => (
                  <SelectItem key={status.id} value={status.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: status.color_hex }} 
                      />
                      {status.status_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gestor Filter */}
          <div className="space-y-2">
            <Label>Gestor</Label>
            <Select
              value={filters.gestor || 'all'}
              onValueChange={(v) => updateFilter('gestor', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los gestores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los gestores</SelectItem>
                {gestores.map(gestor => (
                  <SelectItem key={gestor.id} value={gestor.id}>
                    {gestor.full_name || gestor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parroquia Filter */}
          <div className="space-y-2">
            <Label>Parroquia</Label>
            <Select
              value={filters.parroquia || 'all'}
              onValueChange={(v) => updateFilter('parroquia', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las parroquias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las parroquias</SelectItem>
                {parroquias.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Oficina Filter */}
          <div className="space-y-2">
            <Label>Oficina</Label>
            <Select
              value={filters.oficina || 'all'}
              onValueChange={(v) => updateFilter('oficina', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las oficinas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las oficinas</SelectItem>
                {oficinas.map(o => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Type Filter */}
          <div className="space-y-2">
            <Label>Tipo de Cliente</Label>
            <Select
              value={filters.clientType || 'all'}
              onValueChange={(v) => updateFilter('clientType', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="potencial_cliente">Potencial Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Quality Filters */}
          <div className="space-y-2">
            <Label>Calidad de Datos</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={filters.hasPhone ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => updateFilter('hasPhone', filters.hasPhone ? undefined : true)}
              >
                Con Tel.
              </Button>
              <Button
                variant={filters.hasEmail ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => updateFilter('hasEmail', filters.hasEmail ? undefined : true)}
              >
                Con Email
              </Button>
              <Button
                variant={filters.hasGeolocalization ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => updateFilter('hasGeolocalization', filters.hasGeolocalization ? undefined : true)}
              >
                Con Geo
              </Button>
            </div>
          </div>

          {/* Vinculacion Range */}
          <div className="space-y-2">
            <Label>Vinculacion Creand (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Min"
                value={filters.minVinculacion || ''}
                onChange={(e) => updateFilter('minVinculacion', e.target.value ? Number(e.target.value) : undefined)}
                className="w-20"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Max"
                value={filters.maxVinculacion || ''}
                onChange={(e) => updateFilter('maxVinculacion', e.target.value ? Number(e.target.value) : undefined)}
                className="w-20"
              />
            </div>
          </div>

          {/* Employees Range */}
          <div className="space-y-2">
            <Label>Numero de Empleados</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Min"
                value={filters.minEmployees || ''}
                onChange={(e) => updateFilter('minEmployees', e.target.value ? Number(e.target.value) : undefined)}
                className="w-20"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                min={0}
                placeholder="Max"
                value={filters.maxEmployees || ''}
                onChange={(e) => updateFilter('maxEmployees', e.target.value ? Number(e.target.value) : undefined)}
                className="w-20"
              />
            </div>
          </div>

          {/* Turnover Range */}
          <div className="space-y-2">
            <Label>Facturacion Anual (EUR)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Min"
                value={filters.minTurnover || ''}
                onChange={(e) => updateFilter('minTurnover', e.target.value ? Number(e.target.value) : undefined)}
                className="w-24"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                min={0}
                placeholder="Max"
                value={filters.maxTurnover || ''}
                onChange={(e) => updateFilter('maxTurnover', e.target.value ? Number(e.target.value) : undefined)}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
