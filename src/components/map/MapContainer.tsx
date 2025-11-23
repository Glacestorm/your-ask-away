import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CompanyWithDetails, MapFilters, StatusColor } from '@/types/database';
import Supercluster from 'supercluster';
import { getSectorIcon, iconToSVGString } from './markerIcons';

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
  mapStyle?: 'default' | 'satellite' | 'terrain';
  view3D?: boolean;
  baseLayers?: {
    roads: boolean;
    labels: boolean;
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
      switch (mapStyle) {
        case 'satellite':
          return {
            version: 8 as const,
            sources: {
              'satellite': {
                type: 'raster',
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: '© Esri',
              },
            },
            layers: [{
              id: 'satellite',
              type: 'raster',
              source: 'satellite',
              minzoom: 0,
              maxzoom: 19,
            }],
          };
        
        case 'terrain':
          return {
            version: 8 as const,
            sources: {
              'terrain': {
                type: 'raster',
                tiles: [
                  'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
                  'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
                  'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
                ],
                tileSize: 256,
                attribution: '© OpenTopoMap',
              },
            },
            layers: [{
              id: 'terrain',
              type: 'raster',
              source: 'terrain',
              minzoom: 0,
              maxzoom: 17,
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
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: '© Esri',
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
          break;
          
        case 'terrain':
          baseStyle = {
            version: 8 as const,
            sources: {
              'base': {
                type: 'raster',
                tiles: [
                  'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
                  'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
                  'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
                ],
                tileSize: 256,
                attribution: '© OpenTopoMap',
              },
            },
            layers: [{
              id: 'base',
              type: 'raster',
              source: 'base',
              minzoom: 0,
              maxzoom: 17,
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

      // Add overlay layers
      const overlayLayers: any[] = [];
      const isSatellite = mapStyle === 'satellite';

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
            'raster-opacity': isSatellite ? 0.3 : 0.5,
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
            'raster-opacity': isSatellite ? 0.6 : 0.3,
          },
        });
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
          el.style.width = '40px';
          el.style.height = '40px';
          el.style.cursor = 'pointer';

          const color = company.status?.color_hex || '#3B82F6';
          
          // Get icon based on sector
          const Icon = getSectorIcon(company.sector);
          const iconPath = getIconPathForMarker(Icon);

          el.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <!-- Pin background -->
              <path
                d="M20 2C14.48 2 10 6.48 10 12c0 7.5 10 23 10 23s10-15.5 10-23c0-5.52-4.48-10-10-10z"
                fill="${color}"
                stroke="white"
                stroke-width="2.5"
              />
              <!-- Icon circle background -->
              <circle cx="20" cy="12" r="5.5" fill="white" />
              <!-- Icon -->
              <g transform="translate(14, 6)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" 
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  ${iconPath}
                </svg>
              </g>
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
