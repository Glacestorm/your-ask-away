import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Building2, RotateCcw, Sun, Moon, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Map3DBuildings: React.FC = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializingRef = useRef(false);
  
  const [pitch, setPitch] = useState(60);
  const [bearing, setBearing] = useState(-17.6);
  const [heightMultiplier, setHeightMultiplier] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Iniciando...');

  const add3DBuildings = useCallback((mapInstance: mapboxgl.Map, darkMode: boolean, multiplier: number) => {
    try {
      const layers = mapInstance.getStyle()?.layers;
      if (!layers) return;

      let labelLayerId: string | undefined;
      for (const layer of layers) {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) {
          labelLayerId = layer.id;
          break;
        }
      }

      if (mapInstance.getLayer('3d-buildings')) {
        mapInstance.removeLayer('3d-buildings');
      }

      mapInstance.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          maxzoom: 22,
          paint: {
            'fill-extrusion-color': darkMode 
              ? ['interpolate', ['linear'], ['get', 'height'],
                  0, 'hsl(230, 30%, 25%)',
                  50, 'hsl(230, 30%, 35%)',
                  100, 'hsl(230, 30%, 45%)',
                  200, 'hsl(230, 30%, 55%)'
                ]
              : ['interpolate', ['linear'], ['get', 'height'],
                  0, 'hsl(35, 30%, 85%)',
                  50, 'hsl(35, 40%, 75%)',
                  100, 'hsl(35, 50%, 65%)',
                  200, 'hsl(35, 60%, 55%)'
                ],
            'fill-extrusion-height': [
              'interpolate', ['linear'], ['zoom'],
              14, 0,
              14.5, ['*', ['get', 'height'], multiplier]
            ],
            'fill-extrusion-base': [
              'interpolate', ['linear'], ['zoom'],
              14, 0,
              14.5, ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.85
          }
        },
        labelLayerId
      );
    } catch (err) {
      console.error('Error adding 3D buildings:', err);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || initializingRef.current || mapRef.current) return;
    initializingRef.current = true;

    const initMap = async () => {
      try {
        setDebugInfo('Obteniendo token...');
        
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        const { data, error: fetchError } = await supabase.functions.invoke('get-mapbox-token', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (fetchError || !data?.token) {
          throw new Error(fetchError?.message || 'Token de Mapbox no configurado');
        }
        
        setDebugInfo('Inicializando mapa...');
        mapboxgl.accessToken = data.token;

        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [2.1734, 41.3851], // Barcelona
          zoom: 16,
          pitch: 60,
          bearing: -17.6,
          antialias: true,
          fadeDuration: 0
        });

        mapRef.current = mapInstance;

        mapInstance.on('load', () => {
          setDebugInfo('Añadiendo edificios 3D...');
          add3DBuildings(mapInstance, false, 1);
          mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
          setIsLoading(false);
          setMapReady(true);
          setDebugInfo('');
        });

        mapInstance.on('error', (e) => {
          console.error('Mapbox error:', e);
          setError(`Error de Mapbox: ${e.error?.message || 'Error desconocido'}`);
          setIsLoading(false);
        });

      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Error al inicializar');
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initializingRef.current = false;
    };
  }, [add3DBuildings]);

  const handleRetry = () => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    initializingRef.current = false;
    setError(null);
    setIsLoading(true);
    setMapReady(false);
    window.location.reload();
  };

  const updatePitch = (value: number[]) => {
    const newPitch = value[0];
    setPitch(newPitch);
    mapRef.current?.easeTo({ pitch: newPitch, duration: 300 });
  };

  const updateBearing = (value: number[]) => {
    const newBearing = value[0];
    setBearing(newBearing);
    mapRef.current?.easeTo({ bearing: newBearing, duration: 300 });
  };

  const updateHeightMultiplier = (value: number[]) => {
    const newMultiplier = value[0];
    setHeightMultiplier(newMultiplier);
    
    if (mapRef.current?.getLayer('3d-buildings')) {
      mapRef.current.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
        'interpolate', ['linear'], ['zoom'],
        14, 0,
        14.5, ['*', ['get', 'height'], newMultiplier]
      ]);
    }
  };

  const toggleDarkMode = () => {
    if (!mapRef.current) return;
    
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    const styleUrl = newDarkMode 
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';
    
    mapRef.current.setStyle(styleUrl);
    mapRef.current.once('style.load', () => {
      if (mapRef.current) {
        add3DBuildings(mapRef.current, newDarkMode, heightMultiplier);
      }
    });
  };

  const resetView = () => {
    if (!mapRef.current) return;
    
    setPitch(60);
    setBearing(-17.6);
    setHeightMultiplier(1);
    
    mapRef.current.flyTo({
      center: [2.1734, 41.3851],
      zoom: 16,
      pitch: 60,
      bearing: -17.6,
      duration: 1500
    });
    
    if (mapRef.current.getLayer('3d-buildings')) {
      mapRef.current.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
        'interpolate', ['linear'], ['zoom'],
        14, 0,
        14.5, ['get', 'height']
      ]);
    }
  };

  const flyToLocation = useCallback((coords: [number, number], name: string) => {
    if (!mapRef.current || !mapReady) {
      console.warn('Map not ready for flyTo:', name);
      return;
    }
    
    mapRef.current.flyTo({
      center: coords,
      zoom: 16,
      pitch: 60,
      bearing: Math.random() * 60 - 30,
      duration: 2000
    });
  }, [mapReady]);

  return (
    <div className="relative w-full h-screen bg-muted">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Back button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-30 bg-background/95 backdrop-blur-sm"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Controls panel */}
      {mapReady && (
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg space-y-4 w-72 z-10">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Mapa 3D - Edificios</span>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Inclinación: {pitch}°</Label>
              <Slider value={[pitch]} onValueChange={updatePitch} min={0} max={85} step={1} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Rotación: {bearing.toFixed(1)}°</Label>
              <Slider value={[bearing]} onValueChange={updateBearing} min={-180} max={180} step={1} />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Altura edificios: x{heightMultiplier.toFixed(1)}</Label>
              <Slider value={[heightMultiplier]} onValueChange={updateHeightMultiplier} min={0.5} max={3} step={0.1} />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleDarkMode} className="flex-1">
              {isDarkMode ? <Sun className="h-4 w-4 mr-1" /> : <Moon className="h-4 w-4 mr-1" />}
              {isDarkMode ? 'Día' : 'Noche'}
            </Button>
            <Button variant="outline" size="sm" onClick={resetView} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Ciudades con edificios 3D</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="default" size="sm" onClick={() => flyToLocation([2.1734, 41.3851], 'Barcelona')}>Barcelona</Button>
              <Button variant="default" size="sm" onClick={() => flyToLocation([-3.7038, 40.4168], 'Madrid')}>Madrid</Button>
              <Button variant="outline" size="sm" onClick={() => flyToLocation([2.3522, 48.8566], 'París')}>París</Button>
              <Button variant="outline" size="sm" onClick={() => flyToLocation([-0.1276, 51.5074], 'Londres')}>Londres</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Andorra (sin datos 3D)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => flyToLocation([1.5218, 42.5063], 'Andorra la Vella')}>Andorra la Vella</Button>
              <Button variant="secondary" size="sm" onClick={() => flyToLocation([1.5347, 42.5103], 'Escaldes')}>Escaldes</Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground italic">
            Nota: Andorra no tiene datos de altura de edificios en Mapbox.
          </p>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="text-center space-y-3 p-6 bg-background/90 rounded-lg border border-border">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-foreground font-medium">Cargando mapa 3D...</p>
            <p className="text-sm text-muted-foreground">{debugInfo}</p>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
          <div className="text-center space-y-4 p-6 max-w-md bg-background rounded-lg border border-border">
            <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <Building2 className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-foreground font-medium">Error al cargar el mapa</p>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button onClick={handleRetry} variant="outline" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map3DBuildings;
