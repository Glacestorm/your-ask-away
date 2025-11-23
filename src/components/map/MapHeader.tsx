import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { MapPin, Menu, LogOut, Settings, BarChart3, UserCircle, Mountain, Layers, Info, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapFilters, StatusColor, Product, MapColorMode } from '@/types/database';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { getSectorIcon } from './markerIcons';
import { formatCnaeWithDescription } from '@/lib/cnaeDescriptions';
import { MarkerStyle } from './markerStyles';

export interface MapBaseLayers {
  roads: boolean;
  labels: boolean;
  markers: boolean;
}

interface MapHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  mapStyle: 'default' | 'satellite';
  view3D: boolean;
  onMapStyleChange: (style: 'default' | 'satellite') => void;
  onView3DChange: (enabled: boolean) => void;
  baseLayers: MapBaseLayers;
  onBaseLayersChange: (layers: MapBaseLayers) => void;
  buildingOpacity: number;
  onBuildingOpacityChange: (opacity: number) => void;
  buildingHeightMultiplier: number;
  onBuildingHeightMultiplierChange: (multiplier: number) => void;
  statusColors: StatusColor[];
  products: Product[];
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  availableParroquias: string[];
  availableCnaes: string[];
  availableSectors: string[];
  colorMode: MapColorMode;
  onColorModeChange: (mode: MapColorMode) => void;
  markerStyle: MarkerStyle;
  onMarkerStyleChange: (style: MarkerStyle) => void;
}

export function MapHeader({ 
  onToggleSidebar, 
  sidebarOpen,
  mapStyle,
  view3D,
  onMapStyleChange,
  onView3DChange,
  baseLayers,
  onBaseLayersChange,
  buildingOpacity,
  onBuildingOpacityChange,
  buildingHeightMultiplier,
  onBuildingHeightMultiplierChange,
  statusColors,
  products,
  filters,
  onFiltersChange,
  availableParroquias,
  availableCnaes,
  availableSectors,
  colorMode,
  onColorModeChange,
  markerStyle,
  onMarkerStyleChange,
}: MapHeaderProps) {
  const { user, signOut, userRole, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<string[]>(['status', 'products']);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleStatusToggle = (statusId: string) => {
    if (!filters) return;
    const newStatusIds = filters.statusIds.includes(statusId)
      ? filters.statusIds.filter((id) => id !== statusId)
      : [...filters.statusIds, statusId];
    onFiltersChange({ ...filters, statusIds: newStatusIds });
  };

  const handleProductToggle = (productId: string) => {
    if (!filters) return;
    const newProductIds = filters.productIds.includes(productId)
      ? filters.productIds.filter((id) => id !== productId)
      : [...filters.productIds, productId];
    onFiltersChange({ ...filters, productIds: newProductIds });
  };

  const handleParroquiaToggle = (parroquia: string) => {
    if (!filters) return;
    const newParroquias = filters.parroquias.includes(parroquia)
      ? filters.parroquias.filter((p) => p !== parroquia)
      : [...filters.parroquias, parroquia];
    onFiltersChange({ ...filters, parroquias: newParroquias });
  };

  const handleCnaeToggle = (cnae: string) => {
    if (!filters) return;
    const newCnaes = filters.cnaes.includes(cnae)
      ? filters.cnaes.filter((c) => c !== cnae)
      : [...filters.cnaes, cnae];
    onFiltersChange({ ...filters, cnaes: newCnaes });
  };

  const handleSectorToggle = (sector: string) => {
    if (!filters) return;
    const newSectors = filters.sectors.includes(sector)
      ? filters.sectors.filter((s) => s !== sector)
      : [...filters.sectors, sector];
    onFiltersChange({ ...filters, sectors: newSectors });
  };

  const activeFiltersCount = 
    (filters?.statusIds?.length || 0) + 
    (filters?.productIds?.length || 0) + 
    (filters?.parroquias?.length || 0) + 
    (filters?.cnaes?.length || 0) +
    (filters?.sectors?.length || 0) +
    ((filters?.vinculacionRange?.min !== 0 || filters?.vinculacionRange?.max !== 100) ? 1 : 0) +
    ((filters?.facturacionRange?.min !== 0 || filters?.facturacionRange?.max !== 10000000) ? 1 : 0) +
    ((filters?.plBancoRange?.min !== -1000000 || filters?.plBancoRange?.max !== 1000000) ? 1 : 0) +
    ((filters?.beneficiosRange?.min !== -1000000 || filters?.beneficiosRange?.max !== 1000000) ? 1 : 0);

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold">Mapa Empresarial</h1>
            <p className="text-xs text-muted-foreground">Andorra</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-2 border-l pl-4 ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs min-w-[100px] justify-between"
              >
                {mapStyle === 'default' && 'Mapa'}
                {mapStyle === 'satellite' && 'Satélite'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 z-50 bg-card">
              <div className="p-1">
                <Button
                  variant={mapStyle === 'default' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onMapStyleChange('default')}
                  className="w-full justify-start h-8 text-xs"
                >
                  Mapa
                </Button>
                <Button
                  variant={mapStyle === 'satellite' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onMapStyleChange('satellite')}
                  className="w-full justify-start h-8 text-xs"
                >
                  Satélite
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant={view3D ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView3DChange(!view3D)}
            className="h-7 text-xs"
          >
            <Mountain className="mr-1 h-3 w-3" />
            {t('map.view3d')}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
              >
                <Layers className="mr-1 h-3 w-3" />
                {t('map.layers')}
                {activeFiltersCount > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[600px] z-50 bg-card p-0">
              <div className="p-3 border-b">
                <h4 className="font-semibold text-sm">{t('map.layersTitle')}</h4>
              </div>
              
              <ScrollArea className="h-[500px]">
                <div className="p-3 space-y-3">
                  {/* Base layers section */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('map.baseLayers')}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="markers"
                        checked={baseLayers.markers}
                        onCheckedChange={(checked) =>
                          onBaseLayersChange({ ...baseLayers, markers: !!checked })
                        }
                      />
                      <Label htmlFor="markers" className="text-sm font-medium cursor-pointer">
                        {t('map.markers')}
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="labels"
                        checked={baseLayers.labels}
                        onCheckedChange={(checked) =>
                          onBaseLayersChange({ ...baseLayers, labels: !!checked })
                        }
                      />
                      <Label htmlFor="labels" className="text-sm font-normal cursor-pointer">
                        {t('map.labels')}
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="roads"
                        checked={baseLayers.roads}
                        onCheckedChange={(checked) =>
                          onBaseLayersChange({ ...baseLayers, roads: !!checked })
                        }
                      />
                      <Label htmlFor="roads" className="text-sm font-normal cursor-pointer">
                        {t('map.roads')}
                      </Label>
                    </div>
                  </div>
                  
                  {/* 3D Buildings controls */}
                  {view3D && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Controles 3D
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="building-opacity" className="text-sm font-normal">
                              Opacidad edificios
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(buildingOpacity * 100)}%
                            </span>
                          </div>
                          <Slider
                            id="building-opacity"
                            min={0}
                            max={1}
                            step={0.05}
                            value={[buildingOpacity]}
                            onValueChange={(value) => onBuildingOpacityChange(value[0])}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="building-height" className="text-sm font-normal">
                              Multiplicador altura
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              {buildingHeightMultiplier.toFixed(1)}x
                            </span>
                          </div>
                          <Slider
                            id="building-height"
                            min={0.5}
                            max={3}
                            step={0.1}
                            value={[buildingHeightMultiplier]}
                            onValueChange={(value) => onBuildingHeightMultiplierChange(value[0])}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <Separator />

                  {/* Marker style selector */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Estilo de chinchetas
                    </p>
                    <div className="space-y-1">
                      {[
                        { value: 'classic', label: 'Clásica', desc: 'Chincheta tradicional' },
                        { value: 'modern', label: 'Moderna', desc: 'Diseño geométrico' },
                        { value: 'minimal', label: 'Minimalista', desc: 'Simple y limpia' },
                      ].map((style) => (
                        <div key={style.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`marker-${style.value}`}
                            checked={markerStyle === style.value}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onMarkerStyleChange(style.value as MarkerStyle);
                              }
                            }}
                          />
                          <Label htmlFor={`marker-${style.value}`} className="flex-1 cursor-pointer">
                            <div className="text-sm font-normal">{style.label}</div>
                            <div className="text-xs text-muted-foreground">{style.desc}</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />

                  {/* Color mode selector */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Coloración de chinchetas
                    </p>
                    <div className="space-y-1">
                      {[
                        { value: 'status', label: 'Por Estado' },
                        { value: 'vinculacion', label: 'Por % Vinculación' },
                        { value: 'facturacion', label: 'Por Facturación' },
                        { value: 'pl_banco', label: 'Por P&L del Banco' },
                        { value: 'beneficios', label: 'Por Beneficios' },
                        { value: 'visitas', label: 'Por Nº Visitas' },
                      ].map((mode) => (
                        <div key={mode.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`color-${mode.value}`}
                            checked={colorMode === mode.value}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onColorModeChange(mode.value as MapColorMode);
                              }
                            }}
                          />
                          <Label htmlFor={`color-${mode.value}`} className="text-sm font-normal cursor-pointer">
                            {mode.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />

                  {/* Filter sections */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Filter className="inline h-3 w-3 mr-1" />
                      {t('map.filters')}
                    </p>

                    {/* Estados */}
                    <Collapsible
                      open={openSections.includes('status')}
                      onOpenChange={() => toggleSection('status')}
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-accent">
                        <span className="text-sm font-medium">{t('map.status')}</span>
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
                              checked={filters?.statusIds?.includes(status.id) || false}
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
                        <span className="text-sm font-medium">{t('map.products')}</span>
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
                              checked={filters?.productIds?.includes(product.id) || false}
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
                          <span className="text-sm font-medium">{t('map.parishes')}</span>
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
                                checked={filters?.parroquias?.includes(parroquia) || false}
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
                          <span className="text-sm font-medium">{t('map.sectors')}</span>
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
                                  checked={filters?.sectors?.includes(sector) || false}
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
                          <span className="text-sm font-medium">{t('map.cnaes')}</span>
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
                                checked={filters?.cnaes?.includes(cnae) || false}
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

                    {/* Porcentaje de Vinculación */}
                    <div className="space-y-3 px-2 py-3">
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            % Vinculación
                          </Label>
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
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Facturación Range */}
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Facturación (€)
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {(filters?.facturacionRange?.min || 0).toLocaleString()}€ - {(filters?.facturacionRange?.max || 10000000).toLocaleString()}€
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

                      {/* P&L Banco Range */}
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            P&L del Banco (€)
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {(filters?.plBancoRange?.min || -1000000).toLocaleString()}€ - {(filters?.plBancoRange?.max || 1000000).toLocaleString()}€
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

                      {/* Beneficios Range */}
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Beneficios (€)
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {(filters?.beneficiosRange?.min || -1000000).toLocaleString()}€ - {(filters?.beneficiosRange?.max || 1000000).toLocaleString()}€
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
                  </div>
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
                        vinculacionRange: {
                          min: 0,
                          max: 100,
                        },
                        facturacionRange: {
                          min: 0,
                          max: 10000000,
                        },
                        plBancoRange: {
                          min: -1000000,
                          max: 1000000,
                        },
                        beneficiosRange: {
                          min: -1000000,
                          max: 1000000,
                        },
                      })
                    }
                    className="w-full"
                  >
                    {t('map.clearFilters')}
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSelector />
        {isAdmin && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hidden sm:flex"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {t('menu.dashboard')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="hidden sm:flex"
            >
              <Settings className="mr-2 h-4 w-4" />
              {t('menu.administration')}
            </Button>
          </>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {t('menu.role')}: {userRole || 'usuario'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              {t('menu.profile')}
            </DropdownMenuItem>
            
            {isAdmin && (
              <>
                <DropdownMenuItem 
                  onClick={() => navigate('/dashboard')}
                  className="sm:hidden"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {t('menu.dashboard')}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => navigate('/admin')}
                  className="sm:hidden"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t('menu.administration')}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="sm:hidden" />
              </>
            )}
            
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('menu.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
