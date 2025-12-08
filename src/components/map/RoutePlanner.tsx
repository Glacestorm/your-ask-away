import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Route, 
  MapPin, 
  Clock, 
  Navigation2, 
  X, 
  Play,
  RotateCcw,
  Loader2,
  Car,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  MousePointer2,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CompanyWithDetails } from '@/types/database';
import { cn, sanitizeHtml } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RouteSegment {
  start_address: string;
  end_address: string;
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  steps: {
    instruction: string;
    distance: { value: number; text: string };
    duration: { value: number; text: string };
    maneuver?: string;
  }[];
}

export interface OptimizedRoute {
  total_distance: { value: number; text: string };
  total_duration: { value: number; text: string };
  origin?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  optimized_order: {
    order: number;
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  }[];
  segments: RouteSegment[];
  polyline: string;
  bounds: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } };
}

type PlannerMode = 'minimized' | 'selecting' | 'panel' | 'results';

interface RoutePlannerProps {
  companies: CompanyWithDetails[];
  onRouteCalculated: (route: OptimizedRoute | null) => void;
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
  selectedCompanyFromMap?: CompanyWithDetails | null;
  isSelectingMode?: boolean;
  onSelectingModeChange?: (selecting: boolean) => void;
  onSelectedCompaniesChange?: (ids: string[]) => void;
}

export function RoutePlanner({ 
  companies, 
  onRouteCalculated, 
  onClose,
  userLocation,
  selectedCompanyFromMap,
  isSelectingMode = false,
  onSelectingModeChange,
  onSelectedCompaniesChange
}: RoutePlannerProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<PlannerMode>('panel');
  const [showDirections, setShowDirections] = useState(false);

  // Get user location on mount
  useEffect(() => {
    if (userLocation) {
      setOrigin(userLocation);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setOrigin({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setOrigin({ latitude: 42.5063, longitude: 1.5218 });
        }
      );
    } else {
      setOrigin({ latitude: 42.5063, longitude: 1.5218 });
    }
  }, [userLocation]);

  // Add company from map click
  useEffect(() => {
    if (selectedCompanyFromMap && mode === 'selecting') {
      addCompanyToRoute(selectedCompanyFromMap);
    }
  }, [selectedCompanyFromMap, mode]);

  // Notify parent about selecting mode changes
  useEffect(() => {
    onSelectingModeChange?.(mode === 'selecting');
  }, [mode, onSelectingModeChange]);

  // Notify parent about selected companies changes
  useEffect(() => {
    onSelectedCompaniesChange?.(selectedCompanies.map(c => c.id));
  }, [selectedCompanies, onSelectedCompaniesChange]);

  const addCompanyToRoute = (company: CompanyWithDetails) => {
    setSelectedCompanies(prev => {
      const isSelected = prev.some(c => c.id === company.id);
      if (isSelected) {
        toast.info(`${company.name} ya está en la ruta`);
        return prev;
      }
      if (prev.length >= 10) {
        toast.error('Máximo 10 empresas por ruta');
        return prev;
      }
      toast.success(`${company.name} añadida a la ruta`);
      return [...prev, company];
    });
    setOptimizedRoute(null);
    onRouteCalculated(null);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const removeCompanyFromRoute = (companyId: string) => {
    setSelectedCompanies(prev => prev.filter(c => c.id !== companyId));
    setOptimizedRoute(null);
    onRouteCalculated(null);
  };

  const handleCalculateRoute = async () => {
    if (!origin) {
      toast.error('No se pudo obtener tu ubicación');
      return;
    }

    if (selectedCompanies.length === 0) {
      toast.error('Selecciona al menos una empresa');
      return;
    }

    setIsLoading(true);

    try {
      const waypoints = selectedCompanies.map(c => ({
        id: c.id,
        name: c.name,
        latitude: c.latitude,
        longitude: c.longitude,
      }));

      const { data, error } = await supabase.functions.invoke('optimize-route', {
        body: { origin, waypoints, optimize: true },
      });

      if (error) throw error;

      if (data.success && data.route) {
        setOptimizedRoute(data.route);
        onRouteCalculated(data.route);
        setMode('results');
        toast.success(`Ruta optimizada: ${data.route.total_distance.text} en ${data.route.total_duration.text}`);
      } else {
        throw new Error(data.error || 'Error al calcular la ruta');
      }
    } catch (error: unknown) {
      console.error('Error calculating route:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al calcular la ruta';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedCompanies([]);
    setOptimizedRoute(null);
    onRouteCalculated(null);
    setMode('panel');
  };

  const handleClose = () => {
    setOptimizedRoute(null);
    onRouteCalculated(null);
    onClose();
  };

  const getGoogleMapsUrl = () => {
    if (!origin || selectedCompanies.length === 0) return '';

    const orderedCompanies = optimizedRoute 
      ? optimizedRoute.optimized_order.map(o => selectedCompanies.find(c => c.id === o.id)!)
      : selectedCompanies;

    const originStr = `${origin.latitude},${origin.longitude}`;
    const destination = orderedCompanies[orderedCompanies.length - 1];
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    let waypointsStr = '';
    if (orderedCompanies.length > 1) {
      const intermediates = orderedCompanies.slice(0, -1);
      waypointsStr = intermediates.map(c => `${c.latitude},${c.longitude}`).join('|');
    }

    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destinationStr}${waypointsStr ? `&waypoints=${waypointsStr}` : ''}&travelmode=driving`;
  };

  const googleMapsUrl = getGoogleMapsUrl();

  // Filter companies based on search query
  const filteredCompanies = companies.filter(company => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      company.name.toLowerCase().includes(query) ||
      company.address?.toLowerCase().includes(query) ||
      company.bp?.toLowerCase().includes(query) ||
      company.tax_id?.toLowerCase().includes(query)
    );
  }).slice(0, 50);

  // Minimized floating badge when in selecting mode or showing results
  if (mode === 'minimized') {
    return (
      <div className="absolute bottom-4 right-4 z-50">
        <Card className="shadow-xl border-2 border-primary bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedCompanies.length} paradas</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setMode('panel')}>
                <Maximize2 className="h-4 w-4 mr-1" />
                Abrir
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Selecting mode: Small floating indicator
  if (mode === 'selecting') {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Card className="shadow-xl border-2 border-primary bg-card animate-pulse">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-primary">
                <MousePointer2 className="h-5 w-5" />
                <span className="font-medium">Haz clic en las chinchetas para seleccionar empresas</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {selectedCompanies.length}/10 seleccionadas
                </Badge>
                <Button 
                  size="sm" 
                  onClick={() => setMode('panel')}
                  disabled={selectedCompanies.length === 0}
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Continuar ({selectedCompanies.length})
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {selectedCompanies.length > 0 && (
                <div className="flex flex-wrap gap-1 max-w-md justify-center">
                  {selectedCompanies.map((c, i) => (
                    <Badge key={c.id} variant="outline" className="text-xs">
                      {i + 1}. {c.name.substring(0, 15)}{c.name.length > 15 ? '...' : ''}
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeCompanyFromRoute(c.id); }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results mode: Floating mini-panel with route info
  if (mode === 'results' && optimizedRoute) {
    return (
      <div className="absolute bottom-4 right-4 z-50 w-80">
        <Card className="shadow-xl border-2 border-primary bg-card">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Route className="h-4 w-4 text-primary" />
                Ruta Calculada
              </CardTitle>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setMode('panel')}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleClose}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-primary/10 rounded-lg p-2 text-center">
                <Car className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-sm font-bold">{optimizedRoute.total_distance.text}</p>
                <p className="text-xs text-muted-foreground">Distancia</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-2 text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-sm font-bold">{optimizedRoute.total_duration.text}</p>
                <p className="text-xs text-muted-foreground">Tiempo</p>
              </div>
            </div>

            {/* Stops */}
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {optimizedRoute.optimized_order.map((waypoint, index) => (
                <div 
                  key={waypoint.id}
                  className="flex items-center gap-2 p-1.5 bg-muted/50 rounded text-xs"
                >
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="truncate flex-1">{waypoint.name}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" asChild>
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Google Maps
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Nueva
                </Button>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => {
                  navigator.clipboard.writeText(googleMapsUrl);
                  toast.success('URL copiada al portapapeles');
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar URL
              </Button>
            </div>

            {/* Toggle directions */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setShowDirections(!showDirections)}
            >
              {showDirections ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {showDirections ? 'Ocultar indicaciones' : 'Ver indicaciones'}
            </Button>

            {showDirections && (
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2 text-xs">
                  {optimizedRoute.segments.map((segment, segIndex) => (
                    <div key={segIndex} className="space-y-1">
                      <div className="font-medium text-primary flex items-center gap-1">
                        <Badge variant="outline" className="h-4 text-xs px-1">{segIndex + 1}</Badge>
                        {segment.end_address.split(',')[0]}
                      </div>
                      <div className="pl-4 space-y-0.5 text-muted-foreground">
                        {segment.steps.slice(0, 3).map((step, stepIndex) => (
                          <p key={stepIndex} dangerouslySetInnerHTML={{ __html: sanitizeHtml(step.instruction) }} />
                        ))}
                        {segment.steps.length > 3 && (
                          <p className="italic">+{segment.steps.length - 3} más pasos</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full panel mode
  return (
    <div className="absolute top-20 right-4 z-40 w-96">
      <Card className="shadow-xl border bg-card max-h-[calc(100vh-120px)] flex flex-col">
        <CardHeader className="p-4 pb-2 border-b shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="h-5 w-5 text-primary" />
              Planificador de Rutas
            </CardTitle>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setMode('minimized')}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {origin && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Navigation2 className="h-3 w-3" />
              <span>Origen: Tu ubicación actual</span>
            </div>
          )}
        </CardHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Select from map button */}
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setMode('selecting')}
            >
              <MousePointer2 className="h-4 w-4 mr-2" />
              Seleccionar chinchetas en el mapa
            </Button>

            {/* Search and Add Companies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Empresas en ruta ({selectedCompanies.length}/10)</span>
                {selectedCompanies.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
              
              {/* Company Search Dropdown */}
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal"
                    disabled={selectedCompanies.length >= 10}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    <span className="text-muted-foreground">
                      {selectedCompanies.length >= 10 
                        ? 'Máximo alcanzado' 
                        : 'Buscar y añadir empresa...'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-0 bg-popover border-border" align="start" side="bottom">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar por nombre, dirección, BP o NRT..." 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No se encontraron empresas</CommandEmpty>
                      <CommandGroup heading="Empresas disponibles">
                        <ScrollArea className="h-64">
                          {filteredCompanies.map((company) => {
                            const isSelected = selectedCompanies.some(c => c.id === company.id);
                            return (
                              <CommandItem
                                key={company.id}
                                value={company.id}
                                onSelect={() => addCompanyToRoute(company)}
                                disabled={isSelected}
                                className={cn(
                                  "cursor-pointer",
                                  isSelected && "opacity-50"
                                )}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{company.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{company.address}</p>
                                  </div>
                                  {isSelected ? (
                                    <Badge variant="secondary" className="shrink-0">En ruta</Badge>
                                  ) : (
                                    <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                                  )}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected Companies List */}
              {selectedCompanies.length > 0 && (
                <div className="border rounded-lg p-2 bg-muted/30 space-y-1">
                  {selectedCompanies.map((company, index) => (
                    <div
                      key={company.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-background border"
                    >
                      <Badge variant="secondary" className="shrink-0 w-6 h-6 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{company.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{company.address}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeCompanyFromRoute(company.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleCalculateRoute}
              disabled={selectedCompanies.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculando ruta...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Calcular Ruta Óptima ({selectedCompanies.length} {selectedCompanies.length === 1 ? 'parada' : 'paradas'})
                </>
              )}
            </Button>

            {/* Route Results */}
            {optimizedRoute && (
              <div className="space-y-4 border-t pt-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <Car className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-xl font-bold">{optimizedRoute.total_distance.text}</p>
                    <p className="text-sm text-muted-foreground">Distancia total</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-xl font-bold">{optimizedRoute.total_duration.text}</p>
                    <p className="text-sm text-muted-foreground">Tiempo estimado</p>
                  </div>
                </div>

                {/* Optimized Order */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Orden optimizado:</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-md border border-green-500/20">
                      <Badge className="bg-green-500 text-white border-0 shrink-0">
                        <Navigation2 className="h-3 w-3" />
                      </Badge>
                      <span className="text-sm font-medium">Tu ubicación (inicio)</span>
                    </div>
                    {optimizedRoute.optimized_order.map((waypoint, index) => (
                      <div 
                        key={waypoint.id}
                        className="flex items-center gap-2 p-3 bg-muted/50 rounded-md"
                      >
                        <Badge variant="secondary" className="shrink-0">{index + 1}</Badge>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{waypoint.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Turn-by-turn directions using Accordion */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="directions" className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">Ver indicaciones detalladas</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3">
                        {optimizedRoute.segments.map((segment, segIndex) => (
                          <div key={segIndex} className="border rounded-md p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="shrink-0">{segIndex + 1}</Badge>
                                <span className="text-sm font-medium truncate">
                                  {segment.end_address.split(',')[0]}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {segment.distance.text} · {segment.duration.text}
                              </span>
                            </div>
                            <div className="pl-6 space-y-1 text-xs text-muted-foreground">
                              {segment.steps.map((step, stepIndex) => (
                                <p key={stepIndex} dangerouslySetInnerHTML={{ __html: sanitizeHtml(step.instruction) }} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button className="flex-1" asChild>
                      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir en Google Maps
                      </a>
                    </Button>
                    <Button variant="outline" onClick={() => setMode('results')}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver en mapa
                    </Button>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      navigator.clipboard.writeText(googleMapsUrl);
                      toast.success('URL copiada al portapapeles');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar URL de Google Maps
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
