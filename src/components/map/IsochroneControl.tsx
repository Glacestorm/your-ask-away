import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, Car, PersonStanding, Bike, Loader2, ChevronDown, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IsochroneData {
  geojson: any;
  center: { latitude: number; longitude: number };
  contours_minutes: number[];
  features: Array<{
    minutes: number;
    area_km2: number;
    color: string;
  }>;
}

interface IsochroneControlProps {
  onIsochroneCalculated: (data: IsochroneData | null) => void;
  selectedLocation?: { latitude: number; longitude: number } | null;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function IsochroneControl({
  onIsochroneCalculated,
  selectedLocation,
  isEnabled,
  onToggle,
}: IsochroneControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [minutes, setMinutes] = useState([5, 10, 15]);
  const [currentData, setCurrentData] = useState<IsochroneData | null>(null);

  const profileIcons = {
    driving: <Car className="h-4 w-4" />,
    walking: <PersonStanding className="h-4 w-4" />,
    cycling: <Bike className="h-4 w-4" />,
  };

  const calculateIsochrone = async () => {
    if (!selectedLocation) {
      toast.error('Selecciona una ubicación en el mapa');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mapbox-isochrone', {
        body: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          profile,
          contours_minutes: minutes,
        },
      });

      if (error) throw error;

      if (data.success) {
        setCurrentData(data);
        onIsochroneCalculated(data);
        toast.success(`Isócrona calculada: ${minutes.join(', ')} minutos`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error calculating isochrone:', error);
      toast.error(error.message || 'Error al calcular isócrona');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (enabled: boolean) => {
    onToggle(enabled);
    if (!enabled) {
      setCurrentData(null);
      onIsochroneCalculated(null);
    }
  };

  const updateMinutes = (index: number, value: number) => {
    const newMinutes = [...minutes];
    newMinutes[index] = value;
    setMinutes(newMinutes.sort((a, b) => a - b));
  };

  return (
    <div className="absolute left-4 top-20 z-10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`bg-card shadow-lg ${isEnabled ? 'border-blue-500 text-blue-600' : ''}`}
          >
            <Clock className={`mr-2 h-4 w-4 ${isEnabled ? 'text-blue-500' : ''}`} />
            Isócrona
            {isEnabled && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                ON
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="mt-2 w-72 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Áreas de Tiempo de Viaje
                </span>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                />
              </CardTitle>
              <CardDescription className="text-xs">
                Calcula áreas alcanzables en X minutos
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Profile Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Modo de transporte</Label>
                <Select value={profile} onValueChange={(v) => setProfile(v as any)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driving">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" /> Conduciendo
                      </div>
                    </SelectItem>
                    <SelectItem value="walking">
                      <div className="flex items-center gap-2">
                        <PersonStanding className="h-4 w-4" /> Caminando
                      </div>
                    </SelectItem>
                    <SelectItem value="cycling">
                      <div className="flex items-center gap-2">
                        <Bike className="h-4 w-4" /> Bicicleta
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Intervals */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">Intervalos de tiempo</Label>
                {minutes.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Contorno {i + 1}</span>
                      <Badge variant="outline" className="text-xs">{m} min</Badge>
                    </div>
                    <Slider
                      value={[m]}
                      onValueChange={([v]) => updateMinutes(i, v)}
                      min={5}
                      max={60}
                      step={5}
                    />
                  </div>
                ))}
              </div>

              {/* Selected Location */}
              {selectedLocation && (
                <div className="rounded-lg bg-muted p-2 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Centro seleccionado
                  </div>
                  <div className="font-mono mt-1">
                    {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                  </div>
                </div>
              )}

              {/* Calculate Button */}
              <Button 
                onClick={calculateIsochrone} 
                disabled={isLoading || !selectedLocation}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  profileIcons[profile]
                )}
                <span className="ml-2">
                  {isLoading ? 'Calculando...' : 'Calcular Isócrona'}
                </span>
              </Button>

              {/* Results */}
              {currentData && currentData.features && (
                <div className="space-y-2 rounded-lg border p-2">
                  <Label className="text-xs font-medium">Resultados</Label>
                  {currentData.features.map((f, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: f.color }}
                        />
                        <span>{f.minutes} min</span>
                      </div>
                      <span className="text-muted-foreground">
                        {f.area_km2.toFixed(2)} km²
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
