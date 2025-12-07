import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Route, 
  MapPin, 
  Clock, 
  Navigation2, 
  X, 
  GripVertical,
  Play,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Car
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CompanyWithDetails } from '@/types/database';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface OptimizedRoute {
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
}

export function RoutePlanner({ 
  companies, 
  onRouteCalculated, 
  onClose,
  userLocation 
}: RoutePlannerProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [expandedSegment, setExpandedSegment] = useState<number | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);

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
          // Default to Andorra la Vella if location not available
          setOrigin({ latitude: 42.5063, longitude: 1.5218 });
        }
      );
    }
  }, [userLocation]);

  const handleCompanyToggle = (company: CompanyWithDetails) => {
    setSelectedCompanies(prev => {
      const isSelected = prev.some(c => c.id === company.id);
      if (isSelected) {
        return prev.filter(c => c.id !== company.id);
      }
      if (prev.length >= 10) {
        toast.error('Máximo 10 empresas por ruta');
        return prev;
      }
      return [...prev, company];
    });
    // Reset route when selection changes
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
    } catch (error: any) {
      console.error('Error calculating route:', error);
      toast.error(error.message || 'Error al calcular la ruta');
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

  return (
    <Card className="absolute top-4 right-4 w-96 max-h-[calc(100vh-2rem)] z-50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="h-5 w-5 text-primary" />
            Planificador de Rutas
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {origin && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation2 className="h-4 w-4" />
            <span>Origen: Tu ubicación actual</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Company Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selecciona empresas ({selectedCompanies.length}/10)</span>
            {selectedCompanies.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          
          <ScrollArea className="h-48 border rounded-lg p-2">
            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay empresas disponibles
              </p>
            ) : (
              <div className="space-y-1">
                {companies.slice(0, 50).map((company, index) => (
                  <div
                    key={company.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                      selectedCompanies.some(c => c.id === company.id)
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleCompanyToggle(company)}
                  >
                    <Checkbox 
                      checked={selectedCompanies.some(c => c.id === company.id)}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{company.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{company.address}</p>
                    </div>
                    {selectedCompanies.some(c => c.id === company.id) && (
                      <Badge variant="secondary" className="shrink-0">
                        {selectedCompanies.findIndex(c => c.id === company.id) + 1}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Calculate Button */}
        <Button 
          className="w-full" 
          onClick={handleCalculateRoute}
          disabled={selectedCompanies.length === 0 || isLoading || !origin}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculando ruta...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Calcular Ruta Óptima
            </>
          )}
        </Button>

        {/* Route Results */}
        {optimizedRoute && (
          <div className="space-y-3 border-t pt-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <Car className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{optimizedRoute.total_distance.text}</p>
                <p className="text-xs text-muted-foreground">Distancia total</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{optimizedRoute.total_duration.text}</p>
                <p className="text-xs text-muted-foreground">Tiempo estimado</p>
              </div>
            </div>

            {/* Optimized Order */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Orden optimizado:</span>
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md">
                  <Badge variant="outline" className="bg-green-500 text-white border-0">
                    <Navigation2 className="h-3 w-3" />
                  </Badge>
                  <span className="text-sm">Tu ubicación</span>
                </div>
                {optimizedRoute.optimized_order.map((waypoint, index) => (
                  <div 
                    key={waypoint.id}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                  >
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span className="text-sm truncate flex-1">{waypoint.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Turn-by-turn directions */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Ver indicaciones detalladas
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ScrollArea className="h-48 mt-2">
                  <div className="space-y-2">
                    {optimizedRoute.segments.map((segment, segIndex) => (
                      <Collapsible 
                        key={segIndex}
                        open={expandedSegment === segIndex}
                        onOpenChange={() => setExpandedSegment(expandedSegment === segIndex ? null : segIndex)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{segIndex + 1}</Badge>
                              <span className="text-sm font-medium truncate max-w-[150px]">
                                {segment.end_address.split(',')[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{segment.distance.text}</span>
                              <span>•</span>
                              <span>{segment.duration.text}</span>
                              {expandedSegment === segIndex ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="pl-6 mt-1 space-y-1">
                            {segment.steps.map((step, stepIndex) => (
                              <div 
                                key={stepIndex}
                                className="text-xs p-2 bg-background border rounded flex items-start gap-2"
                              >
                                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                                <span>{step.instruction}</span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>

            {/* Open in Google Maps */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={openInGoogleMaps}
            >
              <Navigation2 className="h-4 w-4 mr-2" />
              Abrir en Google Maps
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
