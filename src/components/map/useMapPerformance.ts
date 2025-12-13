import { useCallback, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import Supercluster from 'supercluster';
import { CompanyWithDetails, MapFilters } from '@/types/database';

// Performance optimization constants
const CLUSTER_RADIUS = 60;
const CLUSTER_MAX_ZOOM = 16;
const DEBOUNCE_MS = 100;
const MIN_ZOOM_MARKERS = 8;
const MAX_VISIBLE_MARKERS = 500;

export interface ClusteredPoint {
  type: 'Feature';
  properties: CompanyWithDetails & { cluster: boolean };
  geometry: { type: 'Point'; coordinates: [number, number] };
}

/**
 * Hook for optimized map performance following Mapbox GL JS best practices
 */
export function useMapPerformance() {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const superclusterRef = useRef<Supercluster<CompanyWithDetails> | null>(null);
  const cachedFilteredCompanies = useRef<CompanyWithDetails[]>([]);
  const lastFilterHash = useRef<string>('');

  /**
   * Create a hash of filters for memoization
   */
  const getFilterHash = useCallback((filters: MapFilters): string => {
    return JSON.stringify({
      statusIds: filters.statusIds,
      gestorIds: filters.gestorIds,
      parroquias: filters.parroquias,
      cnaes: filters.cnaes,
      sectors: filters.sectors,
      productIds: filters.productIds,
      searchTerm: filters.searchTerm,
      dateRange: filters.dateRange,
      vinculacionRange: filters.vinculacionRange,
      facturacionRange: filters.facturacionRange,
      plBancoRange: filters.plBancoRange,
    });
  }, []);

  /**
   * Optimized company filtering with memoization
   */
  const filterCompanies = useCallback((
    companies: CompanyWithDetails[],
    filters: MapFilters,
    vinculacionData: Record<string, { percentage: number; bank: string; color: string }>
  ): CompanyWithDetails[] => {
    const currentHash = getFilterHash(filters);
    
    // Return cached result if filters haven't changed
    if (currentHash === lastFilterHash.current && cachedFilteredCompanies.current.length > 0) {
      return cachedFilteredCompanies.current;
    }

    // Apply filters in order from most specific to least specific (Mapbox optimization)
    let filtered = companies;

    // 1. Most specific: status filter (usually few status options)
    if (filters.statusIds.length > 0) {
      filtered = filtered.filter(c => filters.statusIds.includes(c.status_id || ''));
    }

    // 2. Gestor filter
    if (filters.gestorIds.length > 0) {
      filtered = filtered.filter(c => filters.gestorIds.includes(c.gestor_id || ''));
    }

    // 3. Parroquia filter
    if (filters.parroquias.length > 0) {
      filtered = filtered.filter(c => filters.parroquias.includes(c.parroquia));
    }

    // 4. CNAE filter
    if (filters.cnaes.length > 0) {
      filtered = filtered.filter(c => filters.cnaes.includes(c.cnae || ''));
    }

    // 5. Sector filter
    if (filters.sectors.length > 0) {
      filtered = filtered.filter(c => filters.sectors.includes(c.sector || ''));
    }

    // 6. Product filter (more complex)
    if (filters.productIds.length > 0) {
      filtered = filtered.filter(c => {
        const productIds = c.products?.map(p => p.id) || [];
        return filters.productIds.some(id => productIds.includes(id));
      });
    }

    // 7. Range filters (less specific, apply last)
    if (filters.vinculacionRange) {
      filtered = filtered.filter(c => {
        const vinc = vinculacionData[c.id];
        if (!vinc) return filters.vinculacionRange!.min <= 0;
        return vinc.percentage >= filters.vinculacionRange!.min && 
               vinc.percentage <= filters.vinculacionRange!.max;
      });
    }

    if (filters.facturacionRange) {
      filtered = filtered.filter(c => {
        if (c.turnover === null) return filters.facturacionRange!.min <= 0;
        return c.turnover >= filters.facturacionRange!.min && 
               c.turnover <= filters.facturacionRange!.max;
      });
    }

    if (filters.plBancoRange) {
      filtered = filtered.filter(c => {
        if (c.pl_banco === null) return true;
        return c.pl_banco >= filters.plBancoRange!.min && 
               c.pl_banco <= filters.plBancoRange!.max;
      });
    }

    // 8. Search term (least specific, apply last)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.address.toLowerCase().includes(searchLower) ||
        c.cnae?.toLowerCase().includes(searchLower) ||
        c.parroquia.toLowerCase().includes(searchLower)
      );
    }

    // Cache result
    cachedFilteredCompanies.current = filtered;
    lastFilterHash.current = currentHash;

    return filtered;
  }, [getFilterHash]);

  /**
   * Initialize or update Supercluster with optimized settings
   */
  const initSupercluster = useCallback((companies: CompanyWithDetails[]): Supercluster<CompanyWithDetails> => {
    const points: ClusteredPoint[] = companies.map(company => ({
      type: 'Feature',
      properties: { ...company, cluster: false },
      geometry: {
        type: 'Point',
        coordinates: [company.longitude, company.latitude],
      },
    }));

    const cluster = new Supercluster<CompanyWithDetails>({
      radius: CLUSTER_RADIUS,
      maxZoom: CLUSTER_MAX_ZOOM,
      minPoints: 2,
      // Performance optimizations
      extent: 512,
      nodeSize: 64,
    });

    cluster.load(points);
    superclusterRef.current = cluster;
    return cluster;
  }, []);

  /**
   * Get visible clusters/points for current map bounds
   */
  const getVisibleClusters = useCallback((
    map: mapboxgl.Map,
    supercluster: Supercluster<CompanyWithDetails>
  ) => {
    const bounds = map.getBounds();
    const zoom = Math.floor(map.getZoom());

    // Skip if zoom is too low to show markers
    if (zoom < MIN_ZOOM_MARKERS) {
      return [];
    }

    const clusters = supercluster.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );

    // Limit visible markers for performance
    if (clusters.length > MAX_VISIBLE_MARKERS) {
      console.warn(`Too many markers (${clusters.length}), consider increasing cluster radius`);
    }

    return clusters;
  }, []);

  /**
   * Debounced marker update to prevent excessive rerenders
   */
  const debouncedUpdate = useCallback((callback: () => void) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(callback, DEBOUNCE_MS);
  }, []);

  /**
   * Get optimized style URL with ?optimize=true for vector tile optimization
   */
  const getOptimizedStyleUrl = useCallback((styleName: string, isDark: boolean): string => {
    let baseUrl: string;
    
    switch (styleName) {
      case 'satellite':
        baseUrl = 'mapbox://styles/mapbox/satellite-streets-v12';
        break;
      default:
        baseUrl = isDark 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/streets-v12';
    }
    
    // Add optimize=true to remove unused layers from vector tiles
    return `${baseUrl}?optimize=true`;
  }, []);

  /**
   * Create optimized 3D buildings layer with minzoom/maxzoom
   */
  const add3DBuildingsLayerOptimized = useCallback((map: mapboxgl.Map) => {
    if (!map.isStyleLoaded()) {
      map.once('styledata', () => add3DBuildingsLayerOptimized(map));
      return;
    }

    if (map.getLayer('3d-buildings')) return;

    // Use Mapbox composite source for better performance
    const layers = map.getStyle().layers;
    const labelLayerId = layers?.find(
      layer => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

    map.addLayer(
      {
        id: '3d-buildings',
        type: 'fill-extrusion',
        source: 'composite',
        'source-layer': 'building',
        // Performance optimization: only render at zoom levels where buildings are visible
        minzoom: 14,
        maxzoom: 22,
        filter: [
          'all',
          // Most specific filter first
          ['has', 'height'],
          ['==', ['get', 'extrude'], 'true'],
          ['==', ['geometry-type'], 'Polygon'],
        ],
        paint: {
          // Simplified expression for better performance
          'fill-extrusion-color': [
            'case',
            ['has', 'colour'],
            ['get', 'colour'],
            'hsl(35, 20%, 85%)'
          ],
          'fill-extrusion-height': [
            'case',
            ['has', 'height'],
            ['get', 'height'],
            // Simplified fallback
            10
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.7,
        },
      },
      labelLayerId
    );
  }, []);

  /**
   * Add GeoJSON source for dynamic company data with optimized settings
   */
  const addCompaniesSource = useCallback((
    map: mapboxgl.Map,
    companies: CompanyWithDetails[]
  ) => {
    const sourceId = 'companies-source';
    
    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: companies.map(company => ({
        type: 'Feature',
        id: company.id,
        properties: {
          id: company.id,
          name: company.name,
          status_color: company.status?.color_hex || '#3B82F6',
          turnover: company.turnover || 0,
          pl_banco: company.pl_banco || 0,
          sector: company.sector || 'general',
        },
        geometry: {
          type: 'Point',
          coordinates: [company.longitude, company.latitude],
        },
      })),
    };

    const existingSource = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    
    if (existingSource) {
      // Update existing source (faster than removing and re-adding)
      existingSource.setData(geojsonData);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
        clusterRadius: CLUSTER_RADIUS,
        // Performance optimizations
        generateId: true,
        tolerance: 0.375,
        buffer: 128,
      });

      // Add clustered circles layer
      map.addLayer({
        id: 'companies-clusters',
        type: 'circle',
        source: sourceId,
        minzoom: 6,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'hsl(220, 70%, 50%)',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, 10,
            25, 50,
            30, 100,
            35
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Add cluster count labels
      map.addLayer({
        id: 'companies-cluster-count',
        type: 'symbol',
        source: sourceId,
        minzoom: 6,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Add unclustered point layer with feature-state for hover
      map.addLayer({
        id: 'companies-unclustered',
        type: 'circle',
        source: sourceId,
        minzoom: 10,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            'hsl(220, 90%, 60%)',
            ['get', 'status_color']
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 6,
            14, 10,
            18, 14
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            2
          ],
          'circle-stroke-color': '#ffffff',
        },
      });
    }
  }, []);

  /**
   * Use feature-state for efficient hover effects (Mapbox optimization)
   */
  const setupFeatureStateHover = useCallback((map: mapboxgl.Map) => {
    let hoveredId: string | number | null = null;
    const sourceId = 'companies-source';
    const layerId = 'companies-unclustered';

    map.on('mousemove', layerId, (e) => {
      if (e.features && e.features.length > 0) {
        // Reset previous hover state
        if (hoveredId !== null) {
          map.setFeatureState(
            { source: sourceId, id: hoveredId },
            { hover: false }
          );
        }
        
        hoveredId = e.features[0].id as string | number;
        
        // Set new hover state
        map.setFeatureState(
          { source: sourceId, id: hoveredId },
          { hover: true }
        );
        
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    map.on('mouseleave', layerId, () => {
      if (hoveredId !== null) {
        map.setFeatureState(
          { source: sourceId, id: hoveredId },
          { hover: false }
        );
      }
      hoveredId = null;
      map.getCanvas().style.cursor = '';
    });
  }, []);

  return {
    filterCompanies,
    initSupercluster,
    getVisibleClusters,
    debouncedUpdate,
    getOptimizedStyleUrl,
    add3DBuildingsLayerOptimized,
    addCompaniesSource,
    setupFeatureStateHover,
    superclusterRef,
    MIN_ZOOM_MARKERS,
    MAX_VISIBLE_MARKERS,
  };
}
