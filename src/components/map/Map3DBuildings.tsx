import React, { useEffect, useRef, useState } from 'react';
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
  const map = useRef<mapboxgl.Map | null>(null);
  const initializingRef = useRef(false);
  
  const [pitch, setPitch] = useState(60);
  const [bearing, setBearing] = useState(-17.6);
  const [heightMultiplier, setHeightMultiplier] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingState, setLoadingState] = useState<'init' | 'token' | 'map' | 'ready' | 'error'>('init');
  const [error, setError] = useState<string | null>(null);

  const add3DBuildings = (mapInstance: mapboxgl.Map, darkMode: boolean, multiplier: number) => {
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
  };

  useEffect(() => {
    if (!mapContainer.current || initializingRef.current || map.current) return;
    
    initializingRef.current = true;

    const initMap = async () => {
      setLoadingState('token');
      setError(null);

      try {
        console.log('Fetching Mapbox token...');
        const { data, error: invokeError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (invokeError) {
          console.error('Token invoke error:', invokeError);
          throw new Error(`Error al obtener token: ${invokeError.message}`);
        }
        
        if (!data?.token) {
          console.error('No token in response:', data);
          throw new Error('No se pudo obtener el token de Mapbox');
        }
        
        console.log('Token obtained, initializing map...');
        mapboxgl.accessToken = data.token;
        setLoadingState('map');

        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [1.5218, 42.5063],
          zoom: 15.5,
          pitch: 60,
          bearing: -17.6,
          antialias: true
        });

        map.current = mapInstance;
        mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

        mapInstance.on('load', () => {
          console.log('Map loaded successfully');
          add3DBuildings(mapInstance, false, 1);
          setLoadingState('ready');
        });
        
        mapInstance.on('error', (e) => {
          console.error('Mapbox error:', e);
        });
        
      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Error al inicializar el mapa');
        setLoadingState('error');
        initializingRef.current = false;
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      initializingRef.current = false;
    };
  }, []);

  const handleRetry = () => {
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    initializingRef.current = false;
    setLoadingState('init');
    // Force re-render to trigger useEffect
    setTimeout(() => {
      setError(null);
      window.location.reload();
    }, 100);
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
        'interpolate', ['linear'], ['zoom'],
        14, 0,
        14.5, ['*', ['get', 'height'], newMultiplier]
      ]);
    }
  };

  const toggleDarkMode = () => {
    if (!map.current) return;
    
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    const styleUrl = newDarkMode 
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';
    
    map.current.setStyle(styleUrl);
    map.current.once('style.load', () => {
      add3DBuildings(map.current!, newDarkMode, heightMultiplier);
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
        'interpolate', ['linear'], ['zoom'],
        14, 0,
        14.5, ['get', 'height']
      ]);
    }
  };

  const flyToLocation = (coords: [number, number]) => {
    if (!map.current || loadingState !== 'ready') return;
    
    map.current.flyTo({
      center: coords,
      zoom: 16,
      pitch: 60,
      bearing: Math.random() * 60 - 30,
      duration: 2000
    });
  };

  const getLoadingMessage = () => {
    switch (loadingState) {
      case 'init': return 'Iniciando...';
      case 'token': return 'Obteniendo token de Mapbox...';
      case 'map': return 'Cargando mapa 3D...';
      default: return 'Cargando...';
    }
  };

  const isReady = loadingState === 'ready';
  const isLoading = loadingState !== 'ready' && loadingState !== 'error';

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-20 bg-background/95 backdrop-blur-sm"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {isReady && (
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
            <Label className="text-sm text-muted-foreground">Andorra</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => flyToLocation([1.5218, 42.5063])}>Andorra la Vella</Button>
              <Button variant="secondary" size="sm" onClick={() => flyToLocation([1.5347, 42.5103])}>Escaldes</Button>
              <Button variant="secondary" size="sm" onClick={() => flyToLocation([1.4881, 42.5441])}>La Massana</Button>
              <Button variant="secondary" size="sm" onClick={() => flyToLocation([1.5985, 42.5516])}>Canillo</Button>
              <Button variant="secondary" size="sm" onClick={() => flyToLocation([1.5340, 42.4642])}>Sant Julià</Button>
              <Button variant="secondary" size="sm" onClick={() => flyToLocation([1.4728, 42.5565])}>Ordino</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Altres ciutats</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => flyToLocation([2.1734, 41.3851])}>Barcelona</Button>
              <Button variant="outline" size="sm" onClick={() => flyToLocation([-3.7038, 40.4168])}>Madrid</Button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">{getLoadingMessage()}</p>
          </div>
        </div>
      )}
      
      {loadingState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
          <div className="text-center space-y-4 p-6 max-w-md">
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
