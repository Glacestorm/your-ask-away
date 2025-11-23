import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MapFilters, StatusColor, Product } from '@/types/database';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSectorIcon } from './markerIcons';
import { formatCnaeWithDescription } from '@/lib/cnaeDescriptions';

interface MapLayersControlProps {
  statusColors: StatusColor[];
  products: Product[];
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  availableParroquias: string[];
  availableCnaes: string[];
  availableSectors: string[];
}

export function MapLayersControl({
  statusColors,
  products,
  filters,
  onFiltersChange,
  availableParroquias,
  availableCnaes,
  availableSectors,
}: MapLayersControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['status', 'products']);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleStatusToggle = (statusId: string) => {
    const newStatusIds = filters.statusIds.includes(statusId)
      ? filters.statusIds.filter((id) => id !== statusId)
      : [...filters.statusIds, statusId];
    onFiltersChange({ ...filters, statusIds: newStatusIds });
  };

  const handleProductToggle = (productId: string) => {
    const newProductIds = filters.productIds.includes(productId)
      ? filters.productIds.filter((id) => id !== productId)
      : [...filters.productIds, productId];
    onFiltersChange({ ...filters, productIds: newProductIds });
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

  const activeFiltersCount = 
    filters.statusIds.length + 
    filters.productIds.length + 
    filters.parroquias.length + 
    filters.cnaes.length +
    filters.sectors.length;

  return (
    <div className="absolute left-4 top-4 z-10">
      {!isOpen ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-card shadow-lg hover:bg-accent"
        >
          <Layers className="mr-2 h-4 w-4" />
          Capas
          {activeFiltersCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      ) : (
        <Card className="w-80 shadow-lg">
          <div className="border-b p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Capas del mapa</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-1 p-3">
              {/* Estados */}
              <Collapsible
                open={openSections.includes('status')}
                onOpenChange={() => toggleSection('status')}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-accent">
                  <span className="text-sm font-medium">Estados</span>
                  {openSections.includes('status') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {statusColors.map((status) => (
                    <div key={status.id} className="flex items-center space-x-2 px-2">
                      <Checkbox
                        id={`status-${status.id}`}
                        checked={filters.statusIds.includes(status.id)}
                        onCheckedChange={() => handleStatusToggle(status.id)}
                      />
                      <div className="flex flex-1 items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: status.color_hex }}
                        />
                        <Label
                          htmlFor={`status-${status.id}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {status.status_name}
                        </Label>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Productos */}
              <Collapsible
                open={openSections.includes('products')}
                onOpenChange={() => toggleSection('products')}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-accent">
                  <span className="text-sm font-medium">Productos</span>
                  {openSections.includes('products') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center space-x-2 px-2">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={filters.productIds.includes(product.id)}
                        onCheckedChange={() => handleProductToggle(product.id)}
                      />
                      <Label
                        htmlFor={`product-${product.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {product.name}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Parroquias */}
              {availableParroquias.length > 0 && (
                <Collapsible
                  open={openSections.includes('parroquias')}
                  onOpenChange={() => toggleSection('parroquias')}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-accent">
                    <span className="text-sm font-medium">Parroquias</span>
                    {openSections.includes('parroquias') ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    {availableParroquias.map((parroquia) => (
                      <div key={parroquia} className="flex items-center space-x-2 px-2">
                        <Checkbox
                          id={`parroquia-${parroquia}`}
                          checked={filters.parroquias.includes(parroquia)}
                          onCheckedChange={() => handleParroquiaToggle(parroquia)}
                        />
                        <Label
                          htmlFor={`parroquia-${parroquia}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {parroquia}
                        </Label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Sectores */}
              {availableSectors.length > 0 && (
                <Collapsible
                  open={openSections.includes('sectors')}
                  onOpenChange={() => toggleSection('sectors')}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-accent">
                    <span className="text-sm font-medium">Sectores</span>
                    {openSections.includes('sectors') ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    {availableSectors.map((sector) => {
                      const Icon = getSectorIcon(sector);
                      return (
                        <div key={sector} className="flex items-center space-x-2 px-2">
                          <Checkbox
                            id={`sector-${sector}`}
                            checked={filters.sectors.includes(sector)}
                            onCheckedChange={() => handleSectorToggle(sector)}
                          />
                          <div className="flex flex-1 items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <Label
                              htmlFor={`sector-${sector}`}
                              className="flex-1 cursor-pointer text-sm font-normal"
                            >
                              {sector}
                            </Label>
                          </div>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* CNAEs */}
              {availableCnaes.length > 0 && (
                <Collapsible
                  open={openSections.includes('cnaes')}
                  onOpenChange={() => toggleSection('cnaes')}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-accent">
                    <span className="text-sm font-medium">CNAE</span>
                    {openSections.includes('cnaes') ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    {availableCnaes.map((cnae) => (
                      <div key={cnae} className="flex items-center space-x-2 px-2">
                        <Checkbox
                          id={`cnae-${cnae}`}
                          checked={filters.cnaes.includes(cnae)}
                          onCheckedChange={() => handleCnaeToggle(cnae)}
                        />
                        <Label
                          htmlFor={`cnae-${cnae}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {formatCnaeWithDescription(cnae)}
                        </Label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </ScrollArea>

          {activeFiltersCount > 0 && (
            <div className="border-t p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    statusIds: [],
                    productIds: [],
                    parroquias: [],
                    cnaes: [],
                    sectors: [],
                  })
                }
                className="w-full"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
