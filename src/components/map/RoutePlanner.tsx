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
  ChevronDown,
  ChevronUp,
  Car,
  Search,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CompanyWithDetails } from '@/types/database';
import { cn } from '@/lib/utils';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

interface RoutePlannerProps {
  companies: CompanyWithDetails[];
  onRouteCalculated: (route: OptimizedRoute | null) => void;
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
  selectedCompanyFromMap?: CompanyWithDetails | null;
}

export function RoutePlanner({ 
  companies, 
  onRouteCalculated, 
  onClose,
  userLocation,
  selectedCompanyFromMap
}: RoutePlannerProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (selectedCompanyFromMap) {
      addCompanyToRoute(selectedCompanyFromMap);
    }
  }, [selectedCompanyFromMap]);

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
  };

  const openInGoogleMaps = () => {
    if (!origin || selectedCompanies.length === 0) return;

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

    const url = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destinationStr}${waypointsStr ? `&waypoints=${waypointsStr}` : ''}&travelmode=driving`;
    
    window.open(url, '_blank');
  };

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

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[480px] sm:max-w-[480px] p-0 overflow-hidden">
        <SheetHeader className="p-4 pb-2 border-b bg-card">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Route className="h-5 w-5 text-primary" />
              Planificador de Rutas
            </SheetTitle>
          </div>
          {origin && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Navigation2 className="h-4 w-4" />
              <span>Origen: Tu ubicación actual</span>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-4">
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
                <PopoverContent className="w-[440px] p-0 bg-popover border-border" align="start">
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

              {/* Hint for map selection */}
              <p className="text-xs text-muted-foreground text-center bg-muted/50 p-2 rounded-md">
                💡 También puedes hacer clic en las chinchetas del mapa para añadir empresas
              </p>

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
                          <Accordion type="single" collapsible key={segIndex} className="border rounded-md">
                            <AccordionItem value={`segment-${segIndex}`} className="border-0">
                              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 rounded-md">
                                <div className="flex items-center justify-between w-full mr-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="shrink-0">{segIndex + 1}</Badge>
                                    <span className="text-sm font-medium truncate max-w-[200px]">
                                      {segment.end_address.split(',')[0]}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{segment.distance.text}</span>
                                    <span>•</span>
                                    <span>{segment.duration.text}</span>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 pb-3">
                                <div className="pl-4 space-y-2 border-l-2 border-primary/30 ml-2">
                                  {segment.steps.map((step, stepIndex) => (
                                    <div 
                                      key={stepIndex}
                                      className="text-sm p-2 bg-muted/50 rounded flex items-start gap-2"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-xs text-primary font-medium">{stepIndex + 1}</span>
                                      </div>
                                      <div className="flex-1">
                                        <span dangerouslySetInnerHTML={{ __html: step.instruction }} />
                                        <span className="text-xs text-muted-foreground ml-2">
                                          ({step.distance.text})
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Open in Google Maps */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  size="lg"
                  onClick={openInGoogleMaps}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir en Google Maps
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
