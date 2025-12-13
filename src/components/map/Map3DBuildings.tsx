import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Building2, RotateCcw, Sun, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Map3DBuildings: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [pitch, setPitch] = useState(60);
  const [bearing, setBearing] = useState(-17.6);
  const [heightMultiplier, setHeightMultiplier] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        console.log('Initializing 3D map...');
        
        // Check if user is authenticated
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
          console.warn('User not authenticated, map functions require authentication');
          setError('Debes iniciar sesión para ver el mapa 3D');
          setIsLoaded(true);
          return;
        }
        
        // Get Mapbox token
        console.log('Fetching Mapbox token...');
        const { data, error: invokeError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (invokeError) {
          console.error('Error fetching token:', invokeError);
          setError(`Error al obtener token: ${invokeError.message || 'Error desconocido'}`);
          setIsLoaded(true);
          return;
        }
        
        if (!data?.token) {
          console.error('No token in response:', data);
          setError('No se pudo obtener el token de Mapbox. Verifica la configuración.');
          setIsLoaded(true);
          return;
        }
        
        console.log('Token obtained successfully');
        mapboxgl.accessToken = data.token;

        const styleUrl = isDarkMode 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11';

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: styleUrl,
          center: [1.5218, 42.5063], // Andorra
          zoom: 15.5,
          pitch: pitch,
          bearing: bearing,
          antialias: true
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('style.load', () => {
          console.log('Map style loaded');
          setIsLoaded(true);
          setMapReady(true);
          add3DBuildings();
        });
        
        map.current.on('load', () => {
          console.log('Map fully loaded');
          setMapReady(true);
        });
        
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
        });
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Error al inicializar el mapa');
        setIsLoaded(true);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const add3DBuildings = () => {
    if (!map.current) return;

    const layers = map.current.getStyle()?.layers;
    if (!layers) return;

    // Find the first symbol layer to insert 3D buildings below
    let labelLayerId: string | undefined;
    for (const layer of layers) {
      if (layer.type === 'symbol' && layer.layout?.['text-field']) {
        labelLayerId = layer.id;
        break;
      }
    }

    // Check if layer already exists
    if (map.current.getLayer('3d-buildings')) {
      map.current.removeLayer('3d-buildings');
    }

    map.current.addLayer(
      {
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': isDarkMode 
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
            'interpolate',
            ['linear'],
            ['zoom'],
            14,
            0,
            14.5,
            ['*', ['get', 'height'], heightMultiplier]
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14,
            0,
            14.5,
            ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.85
        }
      },
      labelLayerId
    );
  };

  const updatePitch = (value: number[]) => {
    const newPitch = value[0];
    setPitch(newPitch);
    map.current?.easeTo({ pitch: newPitch, duration: 300 });
  };

  const updateBearing = (value: number[]) => {
    const newBearing = value[0];
    setBearing(newBearing);
    map.current?.easeTo({ bearing: newBearing, duration: 300 });
  };

  const updateHeightMultiplier = (value: number[]) => {
    const newMultiplier = value[0];
    setHeightMultiplier(newMultiplier);
    
    if (map.current?.getLayer('3d-buildings')) {
      map.current.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
        'interpolate',
        ['linear'],
        ['zoom'],
        14,
        0,
        14.5,
        ['*', ['get', 'height'], newMultiplier]
      ]);
    }
  };

  const toggleDarkMode = async () => {
    if (!map.current) return;
    
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    const styleUrl = newDarkMode 
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';
    
    map.current.setStyle(styleUrl);
    
    map.current.once('style.load', () => {
      add3DBuildings();
    });
  };

  const resetView = () => {
    setPitch(60);
    setBearing(-17.6);
    setHeightMultiplier(1);
    
    map.current?.easeTo({
      center: [1.5218, 42.5063],
      zoom: 15.5,
      pitch: 60,
      bearing: -17.6,
      duration: 1000
    });
    
    if (map.current?.getLayer('3d-buildings')) {
      map.current.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
        'interpolate',
        ['linear'],
        ['zoom'],
        14,
        0,
        14.5,
        ['get', 'height']
      ]);
    }
  };

  const flyToLocation = (coords: [number, number], name: string) => {
    if (!map.current || !mapReady) {
      console.warn('Map not ready yet');
      return;
    }
    
    console.log('Flying to:', name, coords);
    map.current.flyTo({
      center: coords,
      zoom: 16,
      pitch: 60,
      bearing: Math.random() * 60 - 30,
      duration: 2000
    });
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Controls Panel */}
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg space-y-4 w-72 z-10">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Building2 className="h-5 w-5 text-primary" />
          <span>Mapa 3D - Edificios</span>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Inclinación: {pitch}°</Label>
            <Slider
              value={[pitch]}
              onValueChange={updatePitch}
              min={0}
              max={85}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Rotación: {bearing.toFixed(1)}°</Label>
            <Slider
              value={[bearing]}
              onValueChange={updateBearing}
              min={-180}
              max={180}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Altura edificios: x{heightMultiplier.toFixed(1)}</Label>
            <Slider
              value={[heightMultiplier]}
              onValueChange={updateHeightMultiplier}
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleDarkMode}
            className="flex-1"
          >
            {isDarkMode ? <Sun className="h-4 w-4 mr-1" /> : <Moon className="h-4 w-4 mr-1" />}
            {isDarkMode ? 'Día' : 'Noche'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetView}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>

        {/* Quick locations */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Ubicaciones</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              disabled={!mapReady}
              onClick={() => flyToLocation([1.5218, 42.5063], 'Andorra la Vella')}
            >
              Andorra
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              disabled={!mapReady}
              onClick={() => flyToLocation([2.1734, 41.3851], 'Barcelona')}
            >
              Barcelona
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              disabled={!mapReady}
              onClick={() => flyToLocation([-3.7038, 40.4168], 'Madrid')}
            >
              Madrid
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              disabled={!mapReady}
              onClick={() => flyToLocation([-73.9857, 40.7484], 'Nueva York')}
            >
              NYC
            </Button>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Cargando mapa 3D...</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
          <div className="text-center space-y-4 p-6 max-w-md">
            <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <Building2 className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-foreground font-medium">Error al cargar el mapa</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map3DBuildings;
