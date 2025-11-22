import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CompanyWithDetails, MapFilters, StatusColor } from '@/types/database';
import Supercluster from 'supercluster';

interface MapContainerProps {
  companies: CompanyWithDetails[];
  statusColors: StatusColor[];
  filters: MapFilters;
  onSelectCompany: (company: CompanyWithDetails) => void;
}

export function MapContainer({
  companies,
  statusColors,
  filters,
  onSelectCompany,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Andorra coordinates
    const andorraCenter: [number, number] = [1.5218, 42.5063];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
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
      },
      center: andorraCenter,
      zoom: 12,
      pitch: 0,
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

  // Update markers when companies or filters change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Filter companies
    const filteredCompanies = companies.filter((company) => {
      // Filter by status
      if (filters.statusIds.length > 0 && !filters.statusIds.includes(company.status_id || '')) {
        return false;
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

    // Add markers for filtered companies
    filteredCompanies.forEach((company) => {
      // CRITICAL: MapLibre uses [longitude, latitude] order
      const coordinates: [number, number] = [company.longitude, company.latitude];

      // Create marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.cursor = 'pointer';

      // Get color from status
      const color = company.status?.color_hex || '#3B82F6';

      // Create marker SVG
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

      // Create marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(coordinates)
        .addTo(map.current!);

      // Create popup
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
          </div>
        </div>
      `);

      el.addEventListener('click', () => {
        marker.setPopup(popup);
        marker.togglePopup();
        onSelectCompany(company);
      });

      markers.current.push(marker);
    });
  }, [companies, filters, mapLoaded, statusColors, onSelectCompany]);

  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}
