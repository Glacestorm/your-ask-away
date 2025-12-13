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
  Eye,
  Map,
  Printer,
  Navigation
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

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
  polyline?: string | null;
  geometry?: { type: string; coordinates: number[][] }; // GeoJSON for Mapbox
  bounds: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } };
  provider?: 'google' | 'mapbox';
}

type PlannerMode = 'minimized' | 'selecting' | 'panel' | 'results';
type RouteProvider = 'google' | 'mapbox';

interface RoutePlannerProps {
  companies: CompanyWithDetails[];
  onRouteCalculated: (route: OptimizedRoute | null) => void;
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
  selectedCompanyFromMap?: CompanyWithDetails | null;
  isSelectingMode?: boolean;
  onSelectingModeChange?: (selecting: boolean) => void;
  onSelectedCompaniesChange?: (ids: string[]) => void;
  onCompanyAddedFromMap?: () => void;
}

export function RoutePlanner({ 
  companies, 
  onRouteCalculated, 
  onClose,
  userLocation,
  selectedCompanyFromMap,
  isSelectingMode = false,
  onSelectingModeChange,
  onSelectedCompaniesChange,
  onCompanyAddedFromMap
}: RoutePlannerProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<PlannerMode>('panel');
  const [showDirections, setShowDirections] = useState(false);
  const [routeProvider, setRouteProvider] = useState<RouteProvider>('mapbox');

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
      // Notify parent to reset the selection so next click works
      onCompanyAddedFromMap?.();
    }
  }, [selectedCompanyFromMap, mode, onCompanyAddedFromMap]);

  // Sync mode with external isSelectingMode prop
  useEffect(() => {
    if (isSelectingMode && mode !== 'selecting') {
      setMode('selecting');
    }
  }, [isSelectingMode]);

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

      let data, error;

      if (routeProvider === 'mapbox') {
        // Use Mapbox Directions API
        const result = await supabase.functions.invoke('mapbox-directions', {
          body: { origin, waypoints, optimize: true, profile: 'driving-traffic' },
        });
        data = result.data;
        error = result.error;
      } else {
        // Use Google Directions API
        const result = await supabase.functions.invoke('optimize-route', {
          body: { origin, waypoints, optimize: true },
        });
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (data.success && data.route) {
        const routeWithProvider = { ...data.route, provider: routeProvider };
        setOptimizedRoute(routeWithProvider);
        onRouteCalculated(routeWithProvider);
        setMode('results');
        const providerName = routeProvider === 'mapbox' ? 'Mapbox' : 'Google';
        toast.success(`Ruta ${providerName}: ${data.route.total_distance.text} en ${data.route.total_duration.text}`);
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

  const handlePrintRoute = () => {
    if (!optimizedRoute) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión');
      return;
    }

    const providerName = optimizedRoute.provider === 'mapbox' ? 'Mapbox Navigation' : 'Google Maps';
    
    let segmentsHtml = '';
    optimizedRoute.segments.forEach((segment, segIndex) => {
      const waypoint = optimizedRoute.optimized_order[segIndex];
      const company = selectedCompanies.find(c => c.id === waypoint?.id);
      
      segmentsHtml += `
        <div class="segment">
          <div class="segment-header">
            <span class="segment-num">${segIndex + 1}</span>
            <div class="segment-info">
              <strong>${waypoint?.name || segment.end_address?.split(',')[0] || `Parada ${segIndex + 1}`}</strong>
              ${company ? `<div class="company-details">
                <span>📍 ${company.address || 'Sin dirección'}</span>
                ${company.phone ? `<span>📞 ${company.phone}</span>` : ''}
                ${company.email ? `<span>✉️ ${company.email}</span>` : ''}
                ${company.bp ? `<span>🏦 BP: ${company.bp}</span>` : ''}
              </div>` : ''}
              <div class="segment-stats">${segment.distance.text} · ${segment.duration.text}</div>
            </div>
          </div>
          <div class="steps">
            ${segment.steps.map((step, i) => `
              <div class="step">
                <span class="step-num">${i + 1}.</span>
                <span>${step.instruction.replace(/<[^>]*>/g, '')}</span>
                <span class="step-distance">${step.distance.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ruta - ${dateStr}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; line-height: 1.5; }
          .header { text-align: center; border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { font-size: 24px; color: #0066cc; margin-bottom: 8px; }
          .header .meta { color: #666; font-size: 14px; }
          .provider { display: inline-block; background: ${optimizedRoute.provider === 'mapbox' ? '#0066cc' : '#ea4335'}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; margin-top: 10px; }
          .summary { display: flex; justify-content: center; gap: 40px; background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
          .summary-item { text-align: center; }
          .summary-item .value { font-size: 28px; font-weight: bold; color: #0066cc; }
          .summary-item .label { color: #666; font-size: 13px; }
          .order { margin-bottom: 25px; }
          .order h2 { font-size: 16px; color: #333; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
          .order-list { display: grid; gap: 8px; }
          .order-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: #fafafa; border-radius: 6px; border-left: 4px solid #0066cc; }
          .order-item.origin { border-left-color: #22c55e; background: #f0fdf4; }
          .order-num { background: #0066cc; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; }
          .order-item.origin .order-num { background: #22c55e; }
          .directions { margin-top: 25px; }
          .directions h2 { font-size: 16px; color: #333; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
          .segment { margin-bottom: 20px; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
          .segment-header { display: flex; align-items: flex-start; gap: 12px; background: #f8f8f8; padding: 12px; }
          .segment-num { background: #0066cc; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
          .segment-info { flex: 1; }
          .segment-info strong { font-size: 15px; display: block; margin-bottom: 4px; }
          .segment-stats { color: #666; font-size: 13px; margin-top: 4px; }
          .company-details { font-size: 12px; color: #555; margin-top: 4px; }
          .company-details span { display: inline-block; margin-right: 12px; }
          .steps { padding: 10px 12px; font-size: 13px; }
          .step { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px dotted #eee; }
          .step:last-child { border-bottom: none; }
          .step-num { color: #999; min-width: 24px; }
          .step-distance { color: #666; margin-left: auto; white-space: nowrap; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #888; font-size: 12px; }
          .url { word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-top: 15px; }
          @media print { body { padding: 10px; } .segment { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🗺️ Ruta Optimizada</h1>
          <div class="meta">${dateStr} · ${timeStr}</div>
          <div class="provider">${providerName}</div>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <div class="value">${optimizedRoute.total_distance.text}</div>
            <div class="label">Distancia Total</div>
          </div>
          <div class="summary-item">
            <div class="value">${optimizedRoute.total_duration.text}</div>
            <div class="label">Tiempo Estimado</div>
          </div>
          <div class="summary-item">
            <div class="value">${optimizedRoute.optimized_order.length}</div>
            <div class="label">Paradas</div>
          </div>
        </div>

        <div class="order">
          <h2>📍 Orden de Visita</h2>
          <div class="order-list">
            <div class="order-item origin">
              <span class="order-num">A</span>
              <span><strong>Tu ubicación</strong> (punto de partida)</span>
            </div>
            ${optimizedRoute.optimized_order.map((wp, i) => {
              const company = selectedCompanies.find(c => c.id === wp.id);
              return `
                <div class="order-item">
                  <span class="order-num">${i + 1}</span>
                  <div>
                    <strong>${wp.name}</strong>
                    ${company?.address ? `<div style="font-size: 12px; color: #666;">${company.address}</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="directions">
          <h2>📋 Indicaciones Detalladas</h2>
          ${segmentsHtml}
        </div>

        <div class="url">
          <strong>Google Maps:</strong> ${googleMapsUrl}
        </div>

        <div class="footer">
          Generado con ObelixIA · ${dateStr}
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    
    toast.success('Abriendo ventana de impresión');
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

  // URL for Google Maps Navigation mode (opens in navigation directly)
  const getGoogleMapsNavigationUrl = () => {
    if (!origin || selectedCompanies.length === 0) return '';
    
    const orderedCompanies = optimizedRoute 
      ? optimizedRoute.optimized_order.map(o => selectedCompanies.find(c => c.id === o.id)!)
      : selectedCompanies;
    
    // Google Maps navigation mode uses different URL format
    const destination = orderedCompanies[orderedCompanies.length - 1];
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving&dir_action=navigate`;
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
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" asChild>
                  <a href={getGoogleMapsNavigationUrl()} target="_blank" rel="noopener noreferrer">
                    <Navigation className="h-3 w-3 mr-1" />
                    Navegar
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver Mapa
                  </a>
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => handlePrintRoute()}
                >
                  <Printer className="h-3 w-3 mr-1" />
                  Imprimir
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={handleReset}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Nueva
                </Button>
              </div>
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
            {/* Route Provider Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Map className="h-4 w-4" />
                Proveedor de rutas
              </Label>
              <Select value={routeProvider} onValueChange={(v: RouteProvider) => setRouteProvider(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mapbox">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Mapbox (Tráfico en tiempo real)
                    </div>
                  </SelectItem>
                  <SelectItem value="google">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Google Maps
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {routeProvider === 'mapbox' 
                  ? 'Usa datos de tráfico en tiempo real para optimizar la ruta'
                  : 'Rutas tradicionales con Google Directions API'}
              </p>
            </div>

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
                {/* Provider Badge */}
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className={cn(
                    "px-3 py-1",
                    optimizedRoute.provider === 'mapbox' ? 'border-blue-500 text-blue-500' : 'border-red-500 text-red-500'
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-2",
                      optimizedRoute.provider === 'mapbox' ? 'bg-blue-500' : 'bg-red-500'
                    )} />
                    {optimizedRoute.provider === 'mapbox' ? 'Mapbox Navigation' : 'Google Maps'}
                  </Badge>
                </div>

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
                                  {segment.end_address?.split(',')[0] || `Parada ${segIndex + 1}`}
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
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(googleMapsUrl);
                        toast.success('URL copiada al portapapeles');
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar URL
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => handlePrintRoute()}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
