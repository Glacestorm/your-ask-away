import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CompanyWithDetails, MapFilters, StatusColor } from '@/types/database';
import Supercluster from 'supercluster';

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

interface MapContainerProps {
  companies: CompanyWithDetails[];
  statusColors: StatusColor[];
  filters: MapFilters;
  onSelectCompany: (company: CompanyWithDetails) => void;
  mapStyle?: 'default' | 'satellite';
  view3D?: boolean;
  baseLayers?: {
    roads: boolean;
    labels: boolean;
    water: boolean;
    terrain: boolean;
    buildings: boolean;
    transit: boolean;
    poi: boolean;
    markers: boolean;
  };
}

export function MapContainer({
  companies,
  statusColors,
  filters,
  onSelectCompany,
  mapStyle = 'default',
  view3D = false,
  baseLayers = {
    roads: true,
    labels: true,
    water: true,
    terrain: true,
    buildings: true,
    transit: true,
    poi: true,
    markers: true,
  },
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const superclusterRef = useRef<Supercluster<CompanyWithDetails> | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Andorra coordinates
    const andorraCenter: [number, number] = [1.5218, 42.5063];

    const getMapStyle = (): any => {
      if (mapStyle === 'satellite') {
        return {
          version: 8 as const,
          sources: {
            'satellite': {
              type: 'raster',
              tiles: [
                'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
              ],
              tileSize: 256,
              attribution: '© Google',
            },
          },
          layers: [
            {
              id: 'satellite',
              type: 'raster',
              source: 'satellite',
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        };
      }
      
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
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      };
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
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map style and 3D view when props change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const getMapStyle = (): any => {
      const baseStyle = mapStyle === 'satellite' ? {
        version: 8 as const,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: [
              'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            attribution: '© Google',
          },
          'protomaps': {
            type: 'vector',
            tiles: [
              'https://tiles.protomaps.com/v3/{z}/{x}/{y}.mvt',
            ],
            maxzoom: 15,
            attribution: '© Protomaps © OpenStreetMap',
          },
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      } : {
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
            attribution: '© OpenStreetMap contributors',
          },
          'protomaps': {
            type: 'vector',
            tiles: [
              'https://tiles.protomaps.com/v3/{z}/{x}/{y}.mvt',
            ],
            maxzoom: 15,
            attribution: '© Protomaps © OpenStreetMap',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      };

      // Add overlay layers based on baseLayers settings
      const overlayLayers: any[] = [];

      if (baseLayers.water) {
        overlayLayers.push({
          id: 'water-overlay',
          type: 'fill',
          source: 'protomaps',
          'source-layer': 'water',
          paint: {
            'fill-color': mapStyle === 'satellite' ? '#4a90e2' : '#a0c8f0',
            'fill-opacity': 0.4,
          },
        });
      }

      if (baseLayers.buildings) {
        overlayLayers.push({
          id: 'buildings-overlay',
          type: 'fill',
          source: 'protomaps',
          'source-layer': 'buildings',
          paint: {
            'fill-color': mapStyle === 'satellite' ? '#666' : '#e0e0e0',
            'fill-opacity': 0.5,
            'fill-outline-color': mapStyle === 'satellite' ? '#444' : '#bbb',
          },
        });
      }

      if (baseLayers.roads) {
        overlayLayers.push({
          id: 'roads-overlay',
          type: 'line',
          source: 'protomaps',
          'source-layer': 'roads',
          paint: {
            'line-color': mapStyle === 'satellite' ? '#ffd700' : '#666',
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8, 0.5,
              16, 3
            ],
          },
        });
      }

      if (baseLayers.transit) {
        overlayLayers.push({
          id: 'transit-overlay',
          type: 'line',
          source: 'protomaps',
          'source-layer': 'transit',
          paint: {
            'line-color': '#ff6b6b',
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        });
      }

      if (baseLayers.poi) {
        overlayLayers.push({
          id: 'poi-overlay',
          type: 'circle',
          source: 'protomaps',
          'source-layer': 'pois',
          paint: {
            'circle-radius': 4,
            'circle-color': '#9b59b6',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1,
          },
        });
      }

      if (baseLayers.labels) {
        overlayLayers.push({
          id: 'places-labels-overlay',
          type: 'symbol',
          source: 'protomaps',
          'source-layer': 'places',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8, 10,
              16, 16
            ],
            'text-font': ['Open Sans Regular'],
          },
          paint: {
            'text-color': mapStyle === 'satellite' ? '#fff' : '#333',
            'text-halo-color': mapStyle === 'satellite' ? '#000' : '#fff',
            'text-halo-width': 2,
          },
        });
      }

      baseStyle.layers.push(...overlayLayers);
      return baseStyle;
    };

    map.current.setStyle(getMapStyle());
    
    // Wait for style to load before adding 3D buildings
    map.current.once('styledata', () => {
      if (!map.current) return;

      // Remove existing 3D building layer if it exists
      if (map.current.getLayer('3d-buildings')) {
        map.current.removeLayer('3d-buildings');
      }

      // Add 3D buildings when view3D is enabled AND buildings layer is enabled
      if (view3D && baseLayers.buildings) {
        // Check if source has buildings layer
        const source = map.current.getSource('protomaps');
        if (source) {
          map.current.addLayer({
            id: '3d-buildings',
            source: 'protomaps',
            'source-layer': 'buildings',
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': mapStyle === 'satellite' ? '#888' : '#ccc',
              'fill-extrusion-height': [
                'case',
                ['has', 'height'],
                ['get', 'height'],
                ['*', ['get', 'building:levels', 3], 3.5]
              ],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.7,
            },
          } as any);
        }
      }
    });

    map.current.easeTo({
      pitch: view3D ? 60 : 0,
      duration: 1000,
    });
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
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.cursor = 'pointer';

          const color = company.status?.color_hex || '#3B82F6';

          el.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 2C11.58 2 8 5.58 8 10c0 6 8 18 8 18s8-12 8-18c0-4.42-3.58-8-8-8z"
                fill="${color}"
                stroke="white"
                stroke-width="2"
              />
              <circle cx="16" cy="10" r="3" fill="white" />
            </svg>
          `;

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(map.current!);

          const popup = new maplibregl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
          }).setHTML(`
            <div class="p-3">
              <h3 class="font-semibold text-sm mb-2">${company.name}</h3>
              <div class="space-y-1 text-xs">
                <p><strong>Estado:</strong> ${company.status?.status_name || 'N/A'}</p>
                <p><strong>Dirección:</strong> ${company.address}</p>
                <p><strong>Parroquia:</strong> ${company.parroquia}</p>
                ${company.cnae ? `<p><strong>CNAE:</strong> ${company.cnae}</p>` : ''}
                ${company.gestor ? `<p><strong>Gestor:</strong> ${company.gestor.full_name || company.gestor.email}</p>` : ''}
                ${company.products && company.products.length > 0 ? `<p><strong>Productos:</strong> ${company.products.length}</p>` : ''}
              </div>
            </div>
          `);

          el.addEventListener('click', () => {
            marker.setPopup(popup);
            marker.togglePopup();
            onSelectCompany(company);
          });

          markers.current.push(marker);
        }
      });
    };

    updateMarkers();

    map.current.on('moveend', updateMarkers);
    map.current.on('zoomend', updateMarkers);

    return () => {
      map.current?.off('moveend', updateMarkers);
      map.current?.off('zoomend', updateMarkers);
    };
  }, [companies, filters, mapLoaded, statusColors, onSelectCompany, baseLayers.markers]);

  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}
