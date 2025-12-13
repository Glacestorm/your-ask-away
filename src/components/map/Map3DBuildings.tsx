import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Building2, RotateCcw, Sun, Moon, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Map3DBuildings: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [pitch, setPitch] = useState(60);
  const [bearing, setBearing] = useState(-17.6);
  const [heightMultiplier, setHeightMultiplier] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingState, setLoadingState] = useState<'auth' | 'token' | 'map' | 'ready' | 'error'>('auth');
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const add3DBuildings = useCallback(() => {
    if (!map.current) return;

    const layers = map.current.getStyle()?.layers;
    if (!layers) return;

    let labelLayerId: string | undefined;
    for (const layer of layers) {
      if (layer.type === 'symbol' && layer.layout?.['text-field']) {
        labelLayerId = layer.id;
        break;
      }
    }

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
        maxzoom: 22,
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
            14, 0,
            14.5, ['*', ['get', 'height'], heightMultiplier]
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 0,
            14.5, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.85
        }
      },
      labelLayerId
    );
  }, [isDarkMode, heightMultiplier]);

  const initMap = useCallback(async () => {
    if (!mapContainer.current) return;
    
    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    setError(null);
    setLoadingState('token');

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('get-mapbox-token');
      
      if (invokeError) {
        throw new Error(`Error al obtener token: ${invokeError.message}`);
      }
      
      if (!data?.token) {
        throw new Error('No se pudo obtener el token de Mapbox');
      }
      
      mapboxgl.accessToken = data.token;
      setLoadingState('map');

      const styleUrl = isDarkMode 
        ? 'mapbox://styles/mapbox/dark-v11?optimize=true'
        : 'mapbox://styles/mapbox/light-v11?optimize=true';

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [1.5218, 42.5063],
        zoom: 15.5,
        pitch: pitch,
        bearing: bearing,
        antialias: true,
        fadeDuration: 0,
        preserveDrawingBuffer: false,
        trackResize: true
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('style.load', () => {
        setLoadingState('ready');
        setMapReady(true);
        add3DBuildings();
      });
      
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        if (e.error?.message?.includes('access token')) {
          setError('Token de Mapbox inválido');
          setLoadingState('error');
        }
      });
    } catch (err) {
      console.error('Error initializing map:', err);
      setError(err instanceof Error ? err.message : 'Error al inicializar el mapa');
      setLoadingState('error');
    }
  }, [isDarkMode, pitch, bearing, add3DBuildings]);

  // Wait for auth then init map
  useEffect(() => {
    if (authLoading) {
      setLoadingState('auth');
      return;
    }

    if (!user) {
      setError('Debes iniciar sesión para ver el mapa 3D');
      setLoadingState('error');
      return;
    }

    initMap();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [authLoading, user, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
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
      ? 'mapbox://styles/mapbox/dark-v11?optimize=true'
      : 'mapbox://styles/mapbox/light-v11?optimize=true';
    
    map.current.setStyle(styleUrl);
    map.current.once('style.load', add3DBuildings);
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
        14, 0,
        14.5, ['get', 'height']
      ]);
    }
  };

  const flyToLocation = (coords: [number, number], name: string) => {
    if (!map.current || !mapReady) return;
    
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
      case 'auth': return 'Verificando autenticación...';
      case 'token': return 'Obteniendo token de Mapbox...';
      case 'map': return 'Cargando mapa 3D...';
      default: return 'Cargando...';
    }
  };

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

      {loadingState === 'ready' && (
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
              <Button variant="secondary" size="sm" disabled={!mapReady} onClick={() => flyToLocation([1.5218, 42.5063], 'Andorra la Vella')}>Andorra la Vella</Button>
              <Button variant="secondary" size="sm" disabled={!mapReady} onClick={() => flyToLocation([1.5347, 42.5103], 'Escaldes')}>Escaldes</Button>
              <Button variant="secondary" size="sm" disabled={!mapReady} onClick={() => flyToLocation([1.4881, 42.5441], 'La Massana')}>La Massana</Button>
              <Button variant="secondary" size="sm" disabled={!mapReady} onClick={() => flyToLocation([1.5985, 42.5516], 'Canillo')}>Canillo</Button>
              <Button variant="secondary" size="sm" disabled={!mapReady} onClick={() => flyToLocation([1.5340, 42.4642], 'Sant Julià')}>Sant Julià</Button>
              <Button variant="secondary" size="sm" disabled={!mapReady} onClick={() => flyToLocation([1.4728, 42.5565], 'Ordino')}>Ordino</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Altres ciutats</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" disabled={!mapReady} onClick={() => flyToLocation([2.1734, 41.3851], 'Barcelona')}>Barcelona</Button>
              <Button variant="outline" size="sm" disabled={!mapReady} onClick={() => flyToLocation([-3.7038, 40.4168], 'Madrid')}>Madrid</Button>
            </div>
          </div>
        </div>
      )}

      {loadingState !== 'ready' && loadingState !== 'error' && (
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
