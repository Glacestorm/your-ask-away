import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CompanyWithDetails, MapFilters, StatusColor, MapColorMode } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import Supercluster from 'supercluster';
import { getSectorIcon, iconToSVGString } from './markerIcons';
import { formatCnaeWithDescription } from '@/lib/cnaeDescriptions';
import { getMarkerStyle, MarkerStyle } from './markerStyles';
import { toast } from 'sonner';
import { CompanyPhotosDialog } from './CompanyPhotosDialog';

type CompanyPoint = {
  type: 'Feature';
  properties: CompanyWithDetails & {
    cluster: boolean;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

// Helper function to add 3D buildings layer with dynamic colors
function add3DBuildingsLayer(map: maplibregl.Map) {
  // Wait for style to be fully loaded
  if (!map.isStyleLoaded()) {
    map.once('styledata', () => add3DBuildingsLayer(map));
    return;
  }

  // Add OSM Buildings source for 3D buildings
  if (!map.getSource('osm-buildings')) {
    map.addSource('osm-buildings', {
      type: 'vector',
      tiles: ['https://tiles.openstreetmap.fr/openriverboatmap/{z}/{x}/{y}.pbf'],
      minzoom: 13,
      maxzoom: 14,
    });
  }

  // Add 3D buildings layer with dynamic coloring by building type
  if (!map.getLayer('3d-buildings')) {
    map.addLayer({
      id: '3d-buildings',
      type: 'fill-extrusion',
      source: 'osm-buildings',
      'source-layer': 'building',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': [
          'case',
          // Commercial (shops, offices) - Blue
          ['in', ['get', 'building'], ['literal', ['commercial', 'retail', 'office']]],
          'hsl(210, 70%, 60%)',
          ['in', ['get', 'shop'], ['literal', ['yes', 'supermarket', 'mall', 'convenience']]],
          'hsl(210, 70%, 60%)',
          ['==', ['get', 'amenity'], 'bank'],
          'hsl(210, 70%, 60%)',
          
          // Residential (houses, apartments) - Green
          ['in', ['get', 'building'], ['literal', ['residential', 'apartments', 'house', 'detached', 'terrace']]],
          'hsl(120, 50%, 55%)',
          
          // Industrial (factories, warehouses) - Orange
          ['in', ['get', 'building'], ['literal', ['industrial', 'warehouse', 'manufacture']]],
          'hsl(25, 80%, 60%)',
          
          // Public buildings (schools, hospitals) - Purple
          ['in', ['get', 'amenity'], ['literal', ['school', 'hospital', 'clinic', 'university', 'college']]],
          'hsl(270, 50%, 60%)',
          ['==', ['get', 'building'], 'public'],
          'hsl(270, 50%, 60%)',
          
          // Religious buildings (churches, temples) - Yellow
          ['in', ['get', 'building'], ['literal', ['church', 'cathedral', 'chapel', 'mosque', 'temple', 'synagogue']]],
          'hsl(45, 80%, 65%)',
          ['==', ['get', 'amenity'], 'place_of_worship'],
          'hsl(45, 80%, 65%)',
          
          // Default color for unknown buildings
          ['has', 'building:colour'],
          ['get', 'building:colour'],
          'hsl(30, 15%, 75%)',
        ],
        'fill-extrusion-height': [
          'case',
          ['has', 'height'],
          ['get', 'height'],
          ['case',
            ['has', 'building:levels'],
            ['*', ['to-number', ['get', 'building:levels']], 3],
            8,
          ],
        ],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.6,
      },
    });
  }
}

interface MapContainerProps {
  companies: CompanyWithDetails[];
  statusColors: StatusColor[];
  filters: MapFilters;
  onSelectCompany: (company: CompanyWithDetails) => void;
  onUpdateCompanyLocation?: (companyId: string, lat: number, lng: number) => Promise<void>;
  mapStyle?: 'default' | 'satellite';
  view3D?: boolean;
  baseLayers?: {
    roads: boolean;
    labels: boolean;
    markers: boolean;
  };
  buildingOpacity?: number;
  buildingHeightMultiplier?: number;
  searchLocation?: {
    lat: number;
    lon: number;
    name: string;
  } | null;
  onSearchLocationClear?: () => void;
  colorMode: MapColorMode;
  markerStyle?: MarkerStyle;
  minZoomVinculacion?: number;
  onMinZoomVinculacionChange?: (zoom: number) => void;
  focusCompanyId?: string | null;
  onFocusCompanyHandled?: () => void;
  routePolyline?: string | null;
  routeWaypoints?: { id: string; name: string; latitude: number; longitude: number }[];
  routeSelectedIds?: string[];
}

interface TooltipConfig {
  field_name: string;
  field_label: string;
  enabled: boolean;
  display_order: number;
}

export function MapContainer({
  companies,
  statusColors,
  filters,
  onSelectCompany,
  onUpdateCompanyLocation,
  mapStyle = 'default',
  view3D = false,
  baseLayers = {
    roads: true,
    labels: true,
    markers: true,
  },
  buildingOpacity = 0.85,
  buildingHeightMultiplier = 1,
  searchLocation,
  onSearchLocationClear,
  colorMode,
  markerStyle = 'classic',
  minZoomVinculacion: minZoomVinculacionProp,
  onMinZoomVinculacionChange,
  focusCompanyId,
  onFocusCompanyHandled,
  routePolyline,
  routeWaypoints,
  routeSelectedIds = [],
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const superclusterRef = useRef<Supercluster<CompanyWithDetails> | null>(null);
  const searchMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [tooltipConfig, setTooltipConfig] = useState<TooltipConfig[]>([]);
  const [vinculacionData, setVinculacionData] = useState<Record<string, { 
    percentage: number; 
    bank: string; 
    color: string;
    allBanks: { bank: string; percentage: number; color: string }[];
  }>>({});
  const [minZoomVinculacion, setMinZoomVinculacion] = useState<number>(minZoomVinculacionProp || 8);
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  const persistentPopupRef = useRef<{ popup: maplibregl.Popup; companyId: string } | null>(null);
  const [focusedMarkerId, setFocusedMarkerId] = useState<string | null>(null);
  
  // State for undo functionality
  const [undoInfo, setUndoInfo] = useState<{
    companyId: string;
    companyName: string;
    originalLat: number;
    originalLng: number;
  } | null>(null);

  // State for photos dialog
  const [photosDialogCompany, setPhotosDialogCompany] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Effect to propagate prop changes to state
  useEffect(() => {
    if (minZoomVinculacionProp !== undefined) {
      setMinZoomVinculacion(minZoomVinculacionProp);
    }
  }, [minZoomVinculacionProp]);

  // Effect to call parent callback when internal state changes
  useEffect(() => {
    if (onMinZoomVinculacionChange) {
      onMinZoomVinculacionChange(minZoomVinculacion);
    }
  }, [minZoomVinculacion, onMinZoomVinculacionChange]);

  // Effect to handle flyTo when focusCompanyId changes
  useEffect(() => {
    if (focusCompanyId && map.current && mapLoaded) {
      const company = companies.find(c => c.id === focusCompanyId);
      if (company && company.latitude && company.longitude) {
        // Set the focused marker ID to trigger pulse animation
        setFocusedMarkerId(focusCompanyId);
        
        map.current.flyTo({
          center: [company.longitude, company.latitude],
          zoom: 16,
          duration: 2000,
          essential: true,
          pitch: view3D ? 60 : 0,
        });
        
        // Remove pulse after 5 seconds
        setTimeout(() => {
          setFocusedMarkerId(null);
        }, 5000);
        
        // Notify parent that focus has been handled
        if (onFocusCompanyHandled) {
          onFocusCompanyHandled();
        }
      }
    }
  }, [focusCompanyId, companies, mapLoaded, view3D, onFocusCompanyHandled]);

  // Effect to draw route polyline on map
  useEffect(() => {
    console.log('Route effect triggered, polyline:', routePolyline?.substring(0, 30), 'mapLoaded:', mapLoaded);
    
    if (!map.current || !mapLoaded) {
      console.log('Map not ready yet');
      return;
    }

    const mapInstance = map.current;
    const sourceId = 'route-source';
    const layerId = 'route-layer';
    const outlineLayerId = 'route-outline-layer';

    // Function to add route layers
    const addRouteLayers = () => {
      console.log('Adding route layers...');
      
      // Remove existing route layers and source
      try {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.removeLayer(layerId);
        }
        if (mapInstance.getLayer(outlineLayerId)) {
          mapInstance.removeLayer(outlineLayerId);
        }
        if (mapInstance.getSource(sourceId)) {
          mapInstance.removeSource(sourceId);
        }
      } catch (e) {
        console.warn('Error removing existing layers:', e);
      }

      if (routePolyline) {
        try {
          // Decode Google's encoded polyline
          const decodedCoords = decodePolyline(routePolyline);
          
          console.log('Decoded route with', decodedCoords.length, 'coordinates');
          console.log('First coord:', decodedCoords[0], 'Last coord:', decodedCoords[decodedCoords.length - 1]);
          
          if (decodedCoords.length > 0) {
            // Add source with route geometry
            mapInstance.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: decodedCoords,
                },
              },
            });

            // Add outline layer (wider, darker) - add first so it's below
            mapInstance.addLayer({
              id: outlineLayerId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#1e3a5f',
                'line-width': 10,
                'line-opacity': 0.8,
              },
            });

            // Add main route layer on top
            mapInstance.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#3b82f6',
                'line-width': 6,
                'line-opacity': 1,
              },
            });

            console.log('Route layers added successfully!');

            // Fit map to route bounds
            const bounds = decodedCoords.reduce(
              (acc, coord) => {
                return [
                  [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
                  [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])],
                ];
              },
              [[Infinity, Infinity], [-Infinity, -Infinity]] as [[number, number], [number, number]]
            );

            console.log('Fitting bounds:', bounds);
            mapInstance.fitBounds(bounds as [[number, number], [number, number]], {
              padding: { top: 100, bottom: 100, left: 100, right: 450 },
              duration: 1000,
            });
          }
        } catch (error) {
          console.error('Error drawing route:', error);
        }
      }
    };

    // Ensure style is loaded before adding layers
    if (mapInstance.isStyleLoaded()) {
      addRouteLayers();
    } else {
      console.log('Waiting for style to load...');
      mapInstance.once('styledata', addRouteLayers);
    }
  }, [routePolyline, mapLoaded]);

  // Helper function to decode Google's encoded polyline
  function decodePolyline(encoded: string): [number, number][] {
    const coords: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coords.push([lng / 1e5, lat / 1e5]);
    }

    return coords;
  }

  // Fetch tooltip configuration
  useEffect(() => {
    const fetchTooltipConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('map_tooltip_config')
          .select('*')
          .eq('enabled', true)
          .order('display_order');

        if (error) {
          console.error('Error fetching tooltip config:', error);
          throw error;
        }
        setTooltipConfig(data || []);

        // Fetch min zoom configuration
        const { data: mapConfigData, error: mapConfigError } = await supabase
          .from('map_config')
          .select('*')
          .eq('config_key', 'min_zoom_vinculacion')
          .maybeSingle();

        if (mapConfigError) {
          console.error('Error fetching map config:', mapConfigError);
          throw mapConfigError;
        }
        if (mapConfigData) {
          const configValue = mapConfigData.config_value as { value: number };
          const dbZoom = configValue.value;
          setMinZoomVinculacion(minZoomVinculacionProp !== undefined ? minZoomVinculacionProp : dbZoom);
        } else if (minZoomVinculacionProp !== undefined) {
          setMinZoomVinculacion(minZoomVinculacionProp);
        }
      } catch (error: any) {
        console.error('Error general en configuración del mapa:', error);
      }
    };

    fetchTooltipConfig();
  }, []);

  // Calculate bank affiliation for each company
  useEffect(() => {
    const calculateMetrics = async () => {
      try {
        // Fetch ALL bank affiliations (not just primary)
        const { data: bankAffiliations, error: bankError } = await supabase
          .from('company_bank_affiliations' as any)
          .select('company_id, bank_name, affiliation_percentage, is_primary, active')
          .eq('active', true)
          .order('is_primary', { ascending: false });

        if (bankError) {
          console.error('Error fetching bank affiliations:', bankError);
          throw bankError;
        }

        // Map bank names to colors
        const bankColors: Record<string, string> = {
          'Creand': '#10b981', // green
          'Morabanc': '#3b82f6', // blue
          'Andbank': '#f59e0b', // amber
        };

        const vinculacionMap: Record<string, { 
          percentage: number; 
          bank: string; 
          color: string;
          allBanks: { bank: string; percentage: number; color: string }[];
        }> = {};
        
        // Group by company_id
        const groupedByCompany: Record<string, any[]> = {};
        bankAffiliations?.forEach((aff: any) => {
          if (!groupedByCompany[aff.company_id]) {
            groupedByCompany[aff.company_id] = [];
          }
          groupedByCompany[aff.company_id].push(aff);
        });

        // For each company, store primary and all banks
        Object.entries(groupedByCompany).forEach(([companyId, affiliations]) => {
          const primary = affiliations.find(a => a.is_primary) || affiliations[0];
          const allBanks = affiliations.map(aff => ({
            bank: aff.bank_name,
            percentage: aff.affiliation_percentage || 0,
            color: bankColors[aff.bank_name] || '#6b7280',
          }));

          vinculacionMap[companyId] = {
            percentage: primary.affiliation_percentage || 0,
            bank: primary.bank_name,
            color: bankColors[primary.bank_name] || '#6b7280',
            allBanks,
          };
        });

        console.log('Vinculación bancaria calculada:', Object.keys(vinculacionMap).length, 'empresas');
        setVinculacionData(vinculacionMap);

        // Fetch visit counts
        const { data: visits, error } = await supabase
          .from('visits')
          .select('company_id');

        if (error) {
          console.error('Error fetching visits:', error);
          throw error;
        }

        const visitCountMap: Record<string, number> = {};
        
        visits?.forEach(visit => {
          if (!visitCountMap[visit.company_id]) {
            visitCountMap[visit.company_id] = 0;
          }
          visitCountMap[visit.company_id] += 1;
        });

        setVisitCounts(visitCountMap);
      } catch (error: any) {
        console.error('Error general calculando métricas:', error);
      }
    };

    if (companies.length > 0) {
      calculateMetrics();
    }
  }, [companies]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Andorra coordinates
    const andorraCenter: [number, number] = [1.5218, 42.5063];

    const getMapStyle = (): any => {
      switch (mapStyle) {
        case 'satellite':
          return {
            version: 8 as const,
            sources: {
              'satellite': {
                type: 'raster',
                tiles: [
                  'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                  'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                  'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                  'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                ],
                tileSize: 256,
                attribution: '© Google',
              },
            },
            layers: [{
              id: 'satellite',
              type: 'raster',
              source: 'satellite',
              minzoom: 0,
              maxzoom: 20,
            }],
          };
        
        default: // 'default'
          return {
            version: 8 as const,
            sources: {
              'osm': {
                type: 'raster',
                tiles: [
                  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                ],
                tileSize: 256,
                attribution: '© OpenStreetMap',
              },
            },
            layers: [{
              id: 'osm',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19,
            }],
          };
      }
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: andorraCenter,
      zoom: 12,
      pitch: view3D ? 60 : 0,
      bearing: 0,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl({
      visualizePitch: true,
    }), 'bottom-right');

    // Add scale control
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add 3D buildings layer
      if (map.current) {
        add3DBuildingsLayer(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map style and 3D view when props change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();

    const getMapStyle = (): any => {
      let baseStyle: any;
      
      switch (mapStyle) {
        case 'satellite':
          baseStyle = {
            version: 8 as const,
            sources: {
              'base': {
                type: 'raster',
                tiles: [
                  'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                  'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                  'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                  'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                ],
                tileSize: 256,
                attribution: '© Google',
              },
            },
            layers: [{
              id: 'base',
              type: 'raster',
              source: 'base',
              minzoom: 0,
              maxzoom: 20,
            }],
          };
          break;
          
        default: // 'default'
          baseStyle = {
            version: 8 as const,
            sources: {
              'base': {
                type: 'raster',
                tiles: [
                  'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                ],
                tileSize: 256,
                attribution: '© OpenStreetMap',
              },
            },
            layers: [{
              id: 'base',
              type: 'raster',
              source: 'base',
              minzoom: 0,
              maxzoom: 19,
            }],
          };
      }

      // Add overlay layers only for non-satellite views
      const overlayLayers: any[] = [];
      
      // Only add overlays for default map style (not satellite)
      if (mapStyle === 'default') {
        if (baseLayers.roads) {
          baseStyle.sources['osm-overlay'] = {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
          };
          overlayLayers.push({
            id: 'roads-overlay',
            type: 'raster',
            source: 'osm-overlay',
            paint: {
              'raster-opacity': 0.5,
            },
          });
        }

        if (baseLayers.labels) {
          if (!baseStyle.sources['osm-overlay']) {
            baseStyle.sources['osm-overlay'] = {
              type: 'raster',
              tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
            };
          }
          overlayLayers.push({
            id: 'labels-overlay',
            type: 'raster',
            source: 'osm-overlay',
            paint: {
              'raster-opacity': 0.3,
            },
          });
        }
      }

      baseStyle.layers.push(...overlayLayers);
      return baseStyle;
    };

    map.current.setStyle(getMapStyle());
    
    // Restore center and zoom after style change
    map.current.once('styledata', () => {
      if (!map.current) return;
      map.current.jumpTo({
        center: currentCenter,
        zoom: currentZoom,
      });
      
      // Re-add 3D buildings layer after style change
      add3DBuildingsLayer(map.current);
    });

    map.current.easeTo({
      pitch: view3D ? 60 : 0,
      duration: 1000,
    });
    
    // Show/hide 3D buildings based on view3D state
    if (map.current.getLayer('3d-buildings')) {
      map.current.setLayoutProperty(
        '3d-buildings',
        'visibility',
        view3D ? 'visible' : 'none'
      );
    }
  }, [mapStyle, view3D, mapLoaded, baseLayers]);

  // Update markers when companies or filters change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    
    // If markers are disabled, return early
    if (!baseLayers.markers) {
      return;
    }

    // Filter companies
    const filteredCompanies = companies.filter((company) => {
      // Filter by status
      if (filters.statusIds.length > 0 && !filters.statusIds.includes(company.status_id || '')) {
        return false;
      }

      // Filter by gestor
      if (filters.gestorIds.length > 0 && !filters.gestorIds.includes(company.gestor_id || '')) {
        return false;
      }

      // Filter by parroquia
      if (filters.parroquias.length > 0 && !filters.parroquias.includes(company.parroquia)) {
        return false;
      }

      // Filter by CNAE
      if (filters.cnaes.length > 0 && !filters.cnaes.includes(company.cnae || '')) {
        return false;
      }

      // Filter by sector
      if (filters.sectors.length > 0 && !filters.sectors.includes(company.sector || '')) {
        return false;
      }

      // Filter by products
      if (filters.productIds.length > 0) {
        const companyProductIds = company.products?.map(p => p.id) || [];
        const hasProduct = filters.productIds.some(id => companyProductIds.includes(id));
        if (!hasProduct) return false;
      }

      // Filter by date range
      if (filters.dateRange?.from && company.fecha_ultima_visita) {
        const visitDate = new Date(company.fecha_ultima_visita);
        if (visitDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && visitDate > filters.dateRange.to) return false;
      }

      // Filter by vinculación percentage range (from visits)
      if (filters.vinculacionRange) {
        const companyVinculacion = vinculacionData[company.id];
        if (companyVinculacion !== undefined) {
          if (companyVinculacion.percentage < filters.vinculacionRange.min || companyVinculacion.percentage > filters.vinculacionRange.max) {
            return false;
          }
        } else {
          // If no vinculación data, only show if min is 0
          if (filters.vinculacionRange.min > 0) {
            return false;
          }
        }
      }

      // Filter by vinculacion entidad 1
      if (filters.vinculacionEntidad1Range) {
        const vinc1 = company.vinculacion_entidad_1;
        if (vinc1 !== null && vinc1 !== undefined) {
          if (vinc1 < filters.vinculacionEntidad1Range.min || vinc1 > filters.vinculacionEntidad1Range.max) {
            return false;
          }
        }
      }

      // Filter by vinculacion entidad 2
      if (filters.vinculacionEntidad2Range) {
        const vinc2 = company.vinculacion_entidad_2;
        if (vinc2 !== null && vinc2 !== undefined) {
          if (vinc2 < filters.vinculacionEntidad2Range.min || vinc2 > filters.vinculacionEntidad2Range.max) {
            return false;
          }
        }
      }

      // Filter by vinculacion entidad 3
      if (filters.vinculacionEntidad3Range) {
        const vinc3 = company.vinculacion_entidad_3;
        if (vinc3 !== null && vinc3 !== undefined) {
          if (vinc3 < filters.vinculacionEntidad3Range.min || vinc3 > filters.vinculacionEntidad3Range.max) {
            return false;
          }
        }
      }

      // Filter by facturación range
      if (filters.facturacionRange) {
        const turnover = company.turnover;
        if (turnover !== null) {
          if (turnover < filters.facturacionRange.min || turnover > filters.facturacionRange.max) {
            return false;
          }
        } else {
          // If no facturación data, only show if min is 0
          if (filters.facturacionRange.min > 0) {
            return false;
          }
        }
      }

      // Filter by P&L banco range
      if (filters.plBancoRange) {
        const pl = company.pl_banco;
        if (pl !== null) {
          if (pl < filters.plBancoRange.min || pl > filters.plBancoRange.max) {
            return false;
          }
        } else {
          // If no P&L data, only show if range includes null
          if (filters.plBancoRange.min > -1000000 || filters.plBancoRange.max < 1000000) {
            return false;
          }
        }
      }

      // Filter by beneficios range
      if (filters.beneficiosRange) {
        const benef = company.beneficios;
        if (benef !== null) {
          if (benef < filters.beneficiosRange.min || benef > filters.beneficiosRange.max) {
            return false;
          }
        } else {
          // If no beneficios data, only show if range includes null
          if (filters.beneficiosRange.min > -1000000 || filters.beneficiosRange.max < 1000000) {
            return false;
          }
        }
      }

      // Filter by search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          company.name.toLowerCase().includes(searchLower) ||
          company.address.toLowerCase().includes(searchLower) ||
          company.cnae?.toLowerCase().includes(searchLower) ||
          company.parroquia.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Initialize Supercluster with filtered companies
    const points: CompanyPoint[] = filteredCompanies.map((company) => ({
      type: 'Feature',
      properties: {
        ...company,
        cluster: false,
      },
      geometry: {
        type: 'Point',
        coordinates: [company.longitude, company.latitude],
      },
    }));

    superclusterRef.current = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
    });
    superclusterRef.current.load(points);

    const updateMarkers = () => {
      if (!map.current || !superclusterRef.current) return;

      // Clear existing markers
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      const bounds = map.current.getBounds();
      const zoom = Math.floor(map.current.getZoom());

      const clusters = superclusterRef.current.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom
      );

      clusters.forEach((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const properties = cluster.properties as any;

        if (properties.cluster) {
          // Create cluster marker
          const clusterCount = properties.point_count;
          const clusterEl = document.createElement('div');
          clusterEl.className = 'cluster-marker';
          clusterEl.style.width = `${40 + (clusterCount / filteredCompanies.length) * 20}px`;
          clusterEl.style.height = `${40 + (clusterCount / filteredCompanies.length) * 20}px`;
          clusterEl.style.cursor = 'pointer';
          
          clusterEl.innerHTML = `
            <div style="
              width: 100%;
              height: 100%;
              background: hsl(var(--primary));
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              color: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            ">
              ${clusterCount}
            </div>
          `;

          const marker = new maplibregl.Marker({ element: clusterEl })
            .setLngLat([longitude, latitude])
            .addTo(map.current!);

          clusterEl.addEventListener('click', () => {
            const expansionZoom = superclusterRef.current!.getClusterExpansionZoom(properties.cluster_id);
            map.current!.easeTo({
              center: [longitude, latitude],
              zoom: expansionZoom,
            });
          });

          markers.current.push(marker);
        } else {
          // Create individual company marker
          const company = properties as CompanyWithDetails;
          
          // Helper function to get color based on color mode
          const getMarkerColor = (): string => {
            switch (colorMode) {
              case 'status':
                return company.status?.color_hex || '#3B82F6';
              
              case 'vinculacion': {
                const vinc = vinculacionData[company.id];
                if (vinc === undefined) return '#94A3B8'; // gray for no data
                // Use the bank-specific color
                return vinc.color;
              }
              
              case 'facturacion': {
                const turnover = company.turnover;
                if (turnover === null) return '#94A3B8';
                if (turnover >= 1000000) return '#22C55E';
                if (turnover >= 500000) return '#EAB308';
                if (turnover >= 100000) return '#F97316';
                return '#EF4444';
              }
              
              case 'pl_banco': {
                const pl = company.pl_banco;
                if (pl === null) return '#94A3B8';
                if (pl > 100000) return '#22C55E';
                if (pl > 0) return '#84CC16';
                if (pl > -50000) return '#EAB308';
                return '#EF4444';
              }
              
              case 'beneficios': {
                const benef = company.beneficios;
                if (benef === null) return '#94A3B8';
                if (benef > 100000) return '#22C55E';
                if (benef > 0) return '#84CC16';
                if (benef > -50000) return '#EAB308';
                return '#EF4444';
              }
              
              case 'visitas': {
                const count = visitCounts[company.id] || 0;
                if (count === 0) return '#EF4444'; // red - no visits
                if (count >= 10) return '#22C55E'; // green - many visits
                if (count >= 5) return '#EAB308'; // yellow - moderate
                return '#F97316'; // orange - few visits
              }
              
              default:
                return company.status?.color_hex || '#3B82F6';
            }
          };

          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.position = 'relative';
          el.style.zIndex = '1000';
          
          // Add pulse animation if this is the focused marker
          if (focusedMarkerId === company.id) {
            el.classList.add('marker-pulse-focus');
          }
          
          // Add blink animation if this marker is selected for route
          if (routeSelectedIds.includes(company.id)) {
            el.classList.add('marker-route-selected');
          }
          
          const color = getMarkerColor();
          const vinculacionInfo = vinculacionData[company.id];
          const vinculacionPct = vinculacionInfo?.percentage;
          const showVinculacion = zoom >= minZoomVinculacion;
          
          // Tamaño base más grande y escalado más pronunciado
          const baseSize = Math.max(40, Math.min(80, (zoom - 8) * 8));
          const markerWidth = showVinculacion ? baseSize * 1.2 : baseSize;
          const markerHeight = showVinculacion ? baseSize * 1.8 : baseSize * 1.4;
          
          el.style.width = `${markerWidth}px`;
          el.style.height = `${markerHeight}px`;
          el.style.cursor = 'pointer';
          
          // Obtener el estilo de chincheta seleccionado
          const style = getMarkerStyle(markerStyle);
          el.innerHTML = style.renderSVG(
            color, 
            markerWidth, 
            markerHeight, 
            showVinculacion && vinculacionPct !== undefined ? vinculacionPct : undefined
          );

          // Create marker with rotation alignment to follow map rotation
          const marker = new maplibregl.Marker({ 
            element: el,
            anchor: 'bottom',
            offset: [0, 0],
            rotationAlignment: 'map',
            pitchAlignment: 'map',
          })
            .setLngLat([longitude, latitude])
            .addTo(map.current!);

          // Manual drag implementation for precise control
          let longPressTimer: NodeJS.Timeout | null = null;
          let isDragMode = false;
          let isDragging = false;
          const originalLng = longitude;
          const originalLat = latitude;
          let startX = 0;
          let startY = 0;
          let startLngLat = { lng: longitude, lat: latitude };

          const activateDragMode = () => {
            isDragMode = true;
            // Disable map interactions
            if (map.current) {
              map.current.dragPan.disable();
              map.current.scrollZoom.disable();
              map.current.doubleClickZoom.disable();
            }
            el.style.cursor = 'grab';
            el.classList.add('marker-dragging');
            el.style.outline = '3px solid hsl(210 100% 50%)';
            el.style.outlineOffset = '2px';
            toast.info(`Ahora puedes arrastrar ${company.name}`, { duration: 3000 });
          };

          const deactivateDragMode = () => {
            isDragMode = false;
            isDragging = false;
            el.style.cursor = 'pointer';
            el.classList.remove('marker-dragging');
            el.style.outline = '';
            el.style.outlineOffset = '';
            // Re-enable map interactions
            if (map.current) {
              map.current.dragPan.enable();
              map.current.scrollZoom.enable();
              map.current.doubleClickZoom.enable();
            }
          };

          const handlePointerDown = (e: PointerEvent) => {
            if (!isDragMode) {
              // Start long press timer
              longPressTimer = setTimeout(() => {
                activateDragMode();
              }, 3000);
            } else {
              // Start dragging
              isDragging = true;
              el.style.cursor = 'grabbing';
              startX = e.clientX;
              startY = e.clientY;
              startLngLat = marker.getLngLat();
              el.setPointerCapture(e.pointerId);
              e.preventDefault();
              e.stopPropagation();
            }
          };

          const handlePointerMove = (e: PointerEvent) => {
            if (!isDragging || !map.current) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Calculate pixel offset
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Convert pixel offset to lng/lat offset
            const startPoint = map.current.project([startLngLat.lng, startLngLat.lat]);
            const newPoint = { x: startPoint.x + dx, y: startPoint.y + dy };
            const newLngLat = map.current.unproject([newPoint.x, newPoint.y]);
            
            marker.setLngLat([newLngLat.lng, newLngLat.lat]);
          };

          const handlePointerUp = async (e: PointerEvent) => {
            // Clear long press timer
            if (longPressTimer) {
              clearTimeout(longPressTimer);
              longPressTimer = null;
            }
            
            if (isDragging) {
              el.releasePointerCapture(e.pointerId);
              
              const newLngLat = marker.getLngLat();
              
              // Check if position actually changed
              const hasMoved = Math.abs(newLngLat.lng - originalLng) > 0.00001 || 
                               Math.abs(newLngLat.lat - originalLat) > 0.00001;
              
              if (hasMoved && onUpdateCompanyLocation) {
                try {
                  await onUpdateCompanyLocation(company.id, newLngLat.lat, newLngLat.lng);
                  setUndoInfo({
                    companyId: company.id,
                    companyName: company.name,
                    originalLat: originalLat,
                    originalLng: originalLng,
                  });
                  toast.success(`Ubicación de ${company.name} actualizada`);
                  setTimeout(() => setUndoInfo(null), 15000);
                } catch (error) {
                  toast.error('Error al actualizar la ubicación');
                  marker.setLngLat([originalLng, originalLat]);
                }
              }
              
              deactivateDragMode();
            }
          };

          const handlePointerCancel = () => {
            if (longPressTimer) {
              clearTimeout(longPressTimer);
              longPressTimer = null;
            }
            if (isDragging) {
              marker.setLngLat([startLngLat.lng, startLngLat.lat]);
              deactivateDragMode();
            }
          };

          el.addEventListener('pointerdown', handlePointerDown);
          el.addEventListener('pointermove', handlePointerMove);
          el.addEventListener('pointerup', handlePointerUp);
          el.addEventListener('pointercancel', handlePointerCancel);
          el.addEventListener('pointerleave', () => {
            if (longPressTimer) {
              clearTimeout(longPressTimer);
              longPressTimer = null;
            }
          });

          // Create hover tooltip with configurable fields
          const hoverPopup = new maplibregl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
            className: 'hover-tooltip',
          });

          const getFieldValue = (fieldName: string) => {
            switch (fieldName) {
              case 'name': return company.name;
              case 'address': return company.address;
              case 'phone': return company.phone || 'N/A';
              case 'email': return company.email || 'N/A';
              case 'employees': return company.employees?.toString() || 'N/A';
              case 'turnover': return company.turnover ? `€${company.turnover.toLocaleString()}` : 'N/A';
              case 'sector': return company.sector || 'N/A';
              case 'status_name': return company.status?.status_name || 'N/A';
              default: return 'N/A';
            }
          };

          let hideTimeout: NodeJS.Timeout | null = null;
          let isPersistent = false;

          const createTooltipHTML = () => {
            const vinculacionBanks = vinculacionInfo?.allBanks || [];
            const totalVinculacion = vinculacionBanks.reduce((sum, bank) => sum + bank.percentage, 0);
            
            return `
            <div class="p-3 min-w-[220px]">
              <h3 class="font-semibold text-sm mb-3 border-b pb-2">${company.name}</h3>
              
              ${vinculacionPct !== undefined ? `
                <div class="mb-2 flex items-center gap-2">
                  <span class="text-xs font-medium">% Vinculación:</span>
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold" style="background: ${color}20; color: ${color}">
                    ${vinculacionPct}%
                  </span>
                </div>
              ` : ''}
              
              ${vinculacionBanks.length > 0 ? `
                <div class="mb-2 space-y-1">
                  <p class="text-xs font-medium">Bancos y Vinculación:</p>
                  ${vinculacionBanks.map(bank => `
                    <div class="flex items-center justify-between text-xs pl-2">
                      <span>${bank.bank}:</span>
                      <span class="px-1.5 py-0.5 rounded text-xs font-semibold" style="background: ${bank.color}20; color: ${bank.color}">
                        ${bank.percentage}%
                      </span>
                    </div>
                  `).join('')}
                  <div class="flex items-center justify-between text-xs font-bold pl-2 pt-1 border-t mt-1">
                    <span>Total:</span>
                    <span>${totalVinculacion}%</span>
                  </div>
                </div>
              ` : ''}
              
              <div class="space-y-1 text-xs">
                ${tooltipConfig
                  .map(config => `
                    <p><strong>${config.field_label}:</strong> ${getFieldValue(config.field_name)}</p>
                  `)
                  .join('')}
              </div>
              <div class="mt-3 pt-2 border-t">
                <button 
                  class="view-photos-btn w-full text-xs font-medium px-2 py-1 rounded transition-colors"
                  style="background: ${color}15; color: ${color}; border: 1px solid ${color}30;"
                  onmouseover="this.style.background='${color}25'"
                  onmouseout="this.style.background='${color}15'"
                  data-company-id="${company.id}"
                >
                  📸 Ver fotos de la empresa
                </button>
              </div>
            </div>
          `;
          };

          const showTooltip = () => {
            // Don't show hover tooltip if there's a persistent popup
            if (persistentPopupRef.current) return;
            
            if (hideTimeout) {
              clearTimeout(hideTimeout);
              hideTimeout = null;
            }
            
            hoverPopup.setLngLat([longitude, latitude]).setHTML(createTooltipHTML()).addTo(map.current!);

            const popupElement = hoverPopup.getElement();
            if (popupElement) {
              popupElement.addEventListener('mouseenter', () => {
                if (hideTimeout) {
                  clearTimeout(hideTimeout);
                  hideTimeout = null;
                }
              });

              popupElement.addEventListener('mouseleave', () => {
                if (!isPersistent) hideTooltip();
              });

              const photoBtn = popupElement.querySelector('.view-photos-btn');
              if (photoBtn) {
                photoBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  hoverPopup.remove();
                  if (persistentPopupRef.current) {
                    persistentPopupRef.current.popup.remove();
                    persistentPopupRef.current = null;
                  }
                  // Open photos dialog
                  setPhotosDialogCompany({ id: company.id, name: company.name });
                });
              }
            }
          };

          const hideTooltip = () => {
            if (isPersistent) return;
            
            hideTimeout = setTimeout(() => {
              const popupElement = hoverPopup.getElement();
              if (popupElement) {
                popupElement.classList.add('tooltip-hiding');
                setTimeout(() => {
                  hoverPopup.remove();
                }, 200);
              } else {
                hoverPopup.remove();
              }
              hideTimeout = null;
            }, 100);
          };

          el.addEventListener('mouseenter', showTooltip);
          el.addEventListener('mouseleave', hideTooltip);

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // If clicking on the same marker that has persistent popup, close it
            if (persistentPopupRef.current && persistentPopupRef.current.companyId === company.id) {
              const popupElement = persistentPopupRef.current.popup.getElement();
              if (popupElement) {
                popupElement.classList.add('tooltip-hiding');
                setTimeout(() => {
                  persistentPopupRef.current?.popup.remove();
                  persistentPopupRef.current = null;
                  isPersistent = false;
                }, 200);
              }
              // Clear selection when closing
              onSelectCompany(null);
              return;
            }

            // Close any existing persistent popup
            if (persistentPopupRef.current) {
              const oldPopupElement = persistentPopupRef.current.popup.getElement();
              if (oldPopupElement) {
                oldPopupElement.classList.add('tooltip-hiding');
                setTimeout(() => {
                  persistentPopupRef.current?.popup.remove();
                }, 200);
              }
            }

            // Remove hover tooltip
            hoverPopup.remove();

            // ✅ FIX: Select company immediately when clicking marker
            onSelectCompany(company);

            // Create new persistent popup
            const persistentPopup = new maplibregl.Popup({
              offset: 25,
              closeButton: false,
              closeOnClick: false,
              className: 'hover-tooltip persistent-tooltip',
            });

            persistentPopup.setLngLat([longitude, latitude]).setHTML(createTooltipHTML()).addTo(map.current!);
            
            isPersistent = true;
            persistentPopupRef.current = { popup: persistentPopup, companyId: company.id };

            // Add photo button handler to persistent popup
            const popupElement = persistentPopup.getElement();
            if (popupElement) {
              const photoBtn = popupElement.querySelector('.view-photos-btn');
              if (photoBtn) {
                photoBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  persistentPopup.remove();
                  persistentPopupRef.current = null;
                  isPersistent = false;
                  // Open photos dialog
                  setPhotosDialogCompany({ id: company.id, name: company.name });
                });
              }
            }
          });

          markers.current.push(marker);
        }
      });
    };

    updateMarkers();

    // Close persistent popup when clicking on map
    const handleMapClick = () => {
      if (persistentPopupRef.current) {
        const popupElement = persistentPopupRef.current.popup.getElement();
        if (popupElement) {
          popupElement.classList.add('tooltip-hiding');
          setTimeout(() => {
            persistentPopupRef.current?.popup.remove();
            persistentPopupRef.current = null;
          }, 200);
        }
      }
    };

    map.current.on('moveend', updateMarkers);
    map.current.on('zoomend', updateMarkers);
    map.current.on('click', handleMapClick);

    return () => {
      map.current?.off('moveend', updateMarkers);
      map.current?.off('zoomend', updateMarkers);
      map.current?.off('click', handleMapClick);
    };
  }, [companies, filters, mapLoaded, statusColors, onSelectCompany, baseLayers.markers, tooltipConfig, vinculacionData, minZoomVinculacion, colorMode, visitCounts, focusedMarkerId]);

  // Update building opacity and height multiplier
  useEffect(() => {
    if (!map.current || !mapLoaded || !view3D) return;

    const layer = map.current.getLayer('3d-buildings');
    if (!layer) return;

    try {
      // Update opacity
      map.current.setPaintProperty(
        '3d-buildings',
        'fill-extrusion-opacity',
        buildingOpacity
      );

      // Update height with multiplier
      map.current.setPaintProperty(
        '3d-buildings',
        'fill-extrusion-height',
        [
          '*',
          buildingHeightMultiplier,
          [
            'case',
            ['has', 'height'],
            ['get', 'height'],
            ['case',
              ['has', 'building:levels'],
              ['*', ['to-number', ['get', 'building:levels']], 3],
              12,
            ],
          ],
        ]
      );
    } catch (error) {
      console.error('Error updating building properties:', error);
    }
  }, [buildingOpacity, buildingHeightMultiplier, mapLoaded, view3D]);

  // Add building hover tooltip
  useEffect(() => {
    if (!map.current || !mapLoaded || !view3D) return;

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'building-popup',
    });

    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['3d-buildings'],
      });

      if (features.length > 0) {
        map.current!.getCanvas().style.cursor = 'pointer';
        const feature = features[0];
        const props = feature.properties;

        // Determine building type
        let buildingType = 'Edificio';
        if (props.building) {
          const bType = props.building;
          if (['commercial', 'retail', 'office'].includes(bType)) buildingType = 'Comercial';
          else if (['residential', 'apartments', 'house'].includes(bType)) buildingType = 'Residencial';
          else if (['industrial', 'warehouse'].includes(bType)) buildingType = 'Industrial';
          else if (bType === 'public') buildingType = 'Público';
          else if (['church', 'cathedral', 'mosque', 'temple'].includes(bType)) buildingType = 'Religioso';
        }
        if (props.amenity) {
          if (['school', 'hospital', 'university'].includes(props.amenity)) buildingType = 'Público';
          else if (props.amenity === 'place_of_worship') buildingType = 'Religioso';
          else if (props.amenity === 'bank') buildingType = 'Comercial';
        }
        if (props.shop) buildingType = 'Comercial';

        // Calculate estimated height
        let height = 12;
        if (props.height) {
          height = parseFloat(props.height);
        } else if (props['building:levels']) {
          height = parseFloat(props['building:levels']) * 3;
        }
        height = Math.round(height * buildingHeightMultiplier);

        const name = props.name || props['addr:street'] || 'Sin nombre';
        const address = props['addr:street'] 
          ? `${props['addr:street']} ${props['addr:housenumber'] || ''}`.trim()
          : 'Dirección no disponible';

        popup
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2">
              <h4 class="font-semibold text-xs mb-1">${name}</h4>
              <div class="text-xs space-y-0.5">
                <p><strong>Tipo:</strong> ${buildingType}</p>
                <p><strong>Altura estimada:</strong> ${height}m</p>
                ${address !== 'Dirección no disponible' ? `<p><strong>Dirección:</strong> ${address}</p>` : ''}
              </div>
            </div>
          `)
          .addTo(map.current!);
      } else {
        map.current!.getCanvas().style.cursor = '';
        popup.remove();
      }
    };

    const onMouseLeave = () => {
      map.current!.getCanvas().style.cursor = '';
      popup.remove();
    };

    map.current.on('mousemove', onMouseMove);
    map.current.on('mouseleave', '3d-buildings', onMouseLeave);

    return () => {
      map.current?.off('mousemove', onMouseMove);
      map.current?.off('mouseleave', onMouseLeave);
      popup.remove();
    };
  }, [mapLoaded, view3D, buildingHeightMultiplier]);

  // Handle search location
  useEffect(() => {
    if (!map.current || !mapLoaded || !searchLocation) return;

    // Remove previous search marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    // Create search marker element
    const el = document.createElement('div');
    el.className = 'search-location-marker';
    el.innerHTML = `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer glow -->
        <circle cx="20" cy="20" r="18" fill="hsl(var(--primary))" opacity="0.2"/>
        <!-- Main pin -->
        <path d="M20 0C11.716 0 5 6.716 5 15c0 8.284 15 25 15 25s15-16.716 15-25C35 6.716 28.284 0 20 0z" 
              fill="hsl(var(--primary))" stroke="white" stroke-width="2"/>
        <!-- Inner circle -->
        <circle cx="20" cy="15" r="6" fill="white"/>
        <!-- Search icon -->
        <g transform="translate(15, 10)">
          <circle cx="5" cy="5" r="3" fill="none" stroke="hsl(var(--primary))" stroke-width="1.5"/>
          <line x1="7" y1="7" x2="9" y2="9" stroke="hsl(var(--primary))" stroke-width="1.5" stroke-linecap="round"/>
        </g>
      </svg>
    `;

    // Create and add marker
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([searchLocation.lon, searchLocation.lat])
      .addTo(map.current);

    const popup = new maplibregl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: true,
    }).setHTML(`
      <div class="p-3">
        <div class="flex items-start justify-between gap-2 mb-2">
          <h3 class="font-semibold text-sm">${searchLocation.name}</h3>
        </div>
        <p class="text-xs text-muted-foreground mb-3">
          Resultado de búsqueda
        </p>
        <button 
          onclick="window.dispatchEvent(new CustomEvent('clearSearchLocation'))"
          class="text-xs text-primary hover:underline"
        >
          Limpiar búsqueda
        </button>
      </div>
    `);

    marker.setPopup(popup);
    marker.togglePopup();
    
    searchMarkerRef.current = marker;

    // Fly to location
    map.current.flyTo({
      center: [searchLocation.lon, searchLocation.lat],
      zoom: 16,
      duration: 2000,
    });

    // Listen for clear event
    const handleClear = () => {
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
      onSearchLocationClear?.();
    };

    window.addEventListener('clearSearchLocation', handleClear);

    return () => {
      window.removeEventListener('clearSearchLocation', handleClear);
    };
  }, [searchLocation, mapLoaded, onSearchLocationClear]);

  const handleUndo = async () => {
    if (!undoInfo || !onUpdateCompanyLocation) return;
    
    try {
      await onUpdateCompanyLocation(undoInfo.companyId, undoInfo.originalLat, undoInfo.originalLng);
      toast.success('Ubicación restaurada correctamente');
      setUndoInfo(null);
    } catch (err) {
      toast.error('Error al restaurar la ubicación');
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* Floating Undo Button */}
      {undoInfo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg shadow-lg px-4 py-3">
            <span className="text-sm text-foreground">
              Ubicación de <strong>{undoInfo.companyName}</strong> actualizada
            </span>
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Deshacer
            </button>
            <button
              onClick={() => setUndoInfo(null)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Photos Dialog */}
      <CompanyPhotosDialog
        open={!!photosDialogCompany}
        onOpenChange={(open) => !open && setPhotosDialogCompany(null)}
        companyId={photosDialogCompany?.id || null}
        companyName={photosDialogCompany?.name || null}
      />
    </div>
  );
}

// Helper function to get icon path for marker
function getIconPathForMarker(Icon: any): string {
  const iconName = Icon.displayName || Icon.name;
  
  const iconPaths: Record<string, string> = {
    'Building2': '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    'Factory': '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>',
    'Store': '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>',
    'Utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    'Hotel': '<path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><path d="M16 11h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M8 7h.01"/><rect x="4" y="2" width="16" height="20" rx="2"/>',
    'Heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    'GraduationCap': '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    'Car': '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    'Truck': '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    'Wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    'Laptop': '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
    'Users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'Briefcase': '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    'Home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    'ShoppingCart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  };
  
  return iconPaths[iconName] || iconPaths['Building2'];
}
