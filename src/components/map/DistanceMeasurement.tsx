import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Ruler, X, MapPin, CornerDownRight, Trash2 } from 'lucide-react';

interface MeasurementPoint {
  latitude: number;
  longitude: number;
}

interface DistanceMeasurementProps {
  onMeasurementChange: (points: MeasurementPoint[], totalDistance: number) => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSelectingModeChange?: (selecting: boolean) => void;
}

export function DistanceMeasurement({
  onMeasurementChange,
  isEnabled,
  onToggle,
  onSelectingModeChange,
}: DistanceMeasurementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [points, setPoints] = useState<MeasurementPoint[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [unit, setUnit] = useState<'km' | 'm'>('km');

  const calculateDistance = (p1: MeasurementPoint, p2: MeasurementPoint): number => {
    // Haversine formula
    const R = 6371000; // Earth radius in meters
    const lat1 = p1.latitude * Math.PI / 180;
    const lat2 = p2.latitude * Math.PI / 180;
    const deltaLat = (p2.latitude - p1.latitude) * Math.PI / 180;
    const deltaLon = (p2.longitude - p1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const calculateTotalDistance = (pts: MeasurementPoint[]): number => {
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      total += calculateDistance(pts[i - 1], pts[i]);
    }
    return total;
  };

  const formatDistance = (meters: number): string => {
    if (unit === 'km') {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const handleToggle = (enabled: boolean) => {
    onToggle(enabled);
    if (!enabled) {
      setPoints([]);
      setIsSelecting(false);
      onSelectingModeChange?.(false);
      onMeasurementChange([], 0);
    }
  };

  const startSelecting = () => {
    setIsSelecting(true);
    onSelectingModeChange?.(true);
  };

  const stopSelecting = () => {
    setIsSelecting(false);
    onSelectingModeChange?.(false);
  };

  const addPoint = (point: MeasurementPoint) => {
    const newPoints = [...points, point];
    setPoints(newPoints);
    onMeasurementChange(newPoints, calculateTotalDistance(newPoints));
  };

  const removePoint = (index: number) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
    onMeasurementChange(newPoints, calculateTotalDistance(newPoints));
  };

  const clearPoints = () => {
    setPoints([]);
    onMeasurementChange([], 0);
  };

  const segments = points.slice(1).map((p, i) => ({
    from: points[i],
    to: p,
    distance: calculateDistance(points[i], p),
  }));

  const totalDistance = calculateTotalDistance(points);

  return (
    <div className="absolute left-4 bottom-20 z-10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`bg-card shadow-lg ${isEnabled ? 'border-green-500 text-green-600' : ''}`}
          >
            <Ruler className={`mr-2 h-4 w-4 ${isEnabled ? 'text-green-500' : ''}`} />
            Medir
            {isEnabled && points.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                {formatDistance(totalDistance)}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="mt-2 w-72 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-green-500" />
                  Medición de Distancias
                </span>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                />
              </CardTitle>
              <CardDescription className="text-xs">
                Haz clic en el mapa para medir distancias
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Unit Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Unidad</Label>
                <div className="flex gap-1">
                  <Button
                    variant={unit === 'm' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setUnit('m')}
                  >
                    Metros
                  </Button>
                  <Button
                    variant={unit === 'km' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setUnit('km')}
                  >
                    Km
                  </Button>
                </div>
              </div>

              {/* Selecting Mode Button */}
              {isEnabled && (
                <Button
                  onClick={isSelecting ? stopSelecting : startSelecting}
                  variant={isSelecting ? 'destructive' : 'default'}
                  className="w-full"
                >
                  {isSelecting ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Parar selección
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Añadir puntos
                    </>
                  )}
                </Button>
              )}

              {/* Points List */}
              {points.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Puntos ({points.length})</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-destructive"
                      onClick={clearPoints}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Limpiar
                    </Button>
                  </div>
                  
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
                    {points.map((point, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center">
                              {i + 1}
                            </Badge>
                            <span className="font-mono text-muted-foreground">
                              {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => removePoint(i)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {i < points.length - 1 && segments[i] && (
                          <div className="ml-6 flex items-center gap-1 text-xs text-muted-foreground">
                            <CornerDownRight className="h-3 w-3" />
                            {formatDistance(segments[i].distance)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Distance */}
              {points.length >= 2 && (
                <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3 text-center">
                  <div className="text-xs text-muted-foreground">Distancia total</div>
                  <div className="text-xl font-bold text-green-700 dark:text-green-300">
                    {formatDistance(totalDistance)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
