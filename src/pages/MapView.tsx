import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MapContainer } from '@/components/map/MapContainer';
import { MapSidebar } from '@/components/map/MapSidebar';
import { MapHeader, MapBaseLayers } from '@/components/map/MapHeader';
import { GeoSearch } from '@/components/map/GeoSearch';
import { RoutePlanner } from '@/components/map/RoutePlanner';
import { CompanyWithDetails, MapFilters, StatusColor, Product, MapColorMode } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Route } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MarkerStyle } from '@/components/map/markerStyles';

interface MapViewProps {
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
}

const MapView = ({ canGoBack, canGoForward, onGoBack, onGoForward }: MapViewProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [statusColors, setStatusColors] = useState<StatusColor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MapFilters>({
    statusIds: [],
    gestorIds: [],
    parroquias: [],
    cnaes: [],
    sectors: [],
    productIds: [],
    dateRange: null,
    searchTerm: '',
    vinculacionRange: {
      min: 0,
      max: 100,
    },
    facturacionRange: {
      min: 0,
      max: 10000000,
    },
    plBancoRange: {
      min: -1000000,
      max: 1000000,
    },
    beneficiosRange: {
      min: -1000000,
      max: 1000000,
    },
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithDetails | null>(null);
  const [focusCompanyId, setFocusCompanyId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'default' | 'satellite'>('default');
  const [view3D, setView3D] = useState(false);
  const [baseLayers, setBaseLayers] = useState<MapBaseLayers>({
    roads: true,
    labels: true,
    markers: true,
  });
  const [buildingOpacity, setBuildingOpacity] = useState(0.85);
  const [buildingHeightMultiplier, setBuildingHeightMultiplier] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);
  const [colorMode, setColorMode] = useState<MapColorMode>('status');
  const [markerStyle, setMarkerStyle] = useState<MarkerStyle>(() => {
    const saved = localStorage.getItem('markerStyle');
    return (saved as MarkerStyle) || 'classic';
  });
  const [minZoomVinculacion, setMinZoomVinculacion] = useState<number>(() => {
    const saved = localStorage.getItem('minZoomVinculacion');
    return saved ? parseFloat(saved) : 8;
  });
  const [sidebarFullscreen, setSidebarFullscreen] = useState(false);
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [routePlannerCompany, setRoutePlannerCompany] = useState<CompanyWithDetails | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle company parameter from URL
  useEffect(() => {
    const companyId = searchParams.get('company');
    if (companyId && companies.length > 0) {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        setSelectedCompany(company);
        setSidebarOpen(true);
        // Trigger flyTo animation
        setFocusCompanyId(companyId);
        // Clear the company parameter from URL after selection
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('company');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, companies]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch companies with related data
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select(`
          *,
          status:status_colors(*),
          gestor:profiles(*)
        `);

      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
        throw companiesError;
      }

      // Fetch products for each company
      const companiesWithProducts = await Promise.all(
        (companiesData || []).map(async (company) => {
          try {
            const { data: productsData, error: productsError } = await supabase
              .from('company_products')
              .select('product_id, products(*)')
              .eq('company_id', company.id)
              .eq('active', true);

            if (productsError) {
              console.error(`Error fetching products for company ${company.id}:`, productsError);
              return {
                ...company,
                products: [],
              };
            }

            return {
              ...company,
              products: productsData?.map((cp: any) => cp.products).filter(Boolean) || [],
            };
          } catch (err) {
            console.error(`Error processing company ${company.id}:`, err);
            return {
              ...company,
              products: [],
            };
          }
        })
      );

      setCompanies(companiesWithProducts as CompanyWithDetails[]);

      // Fetch status colors
      const { data: statusData, error: statusError } = await supabase
        .from('status_colors')
        .select('*')
        .order('display_order');

      if (statusError) {
        console.error('Error fetching status colors:', statusError);
        throw statusError;
      }
      setStatusColors(statusData || []);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw productsError;
      }
      setProducts(productsData || []);

    } catch (error: any) {
      console.error('Error general al cargar datos:', error);
      toast.error(`Error al cargar los datos: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Cargando mapa empresarial...</p>
        </div>
      </div>
    );
  }

  // Get unique parroquias, CNAEs, and sectors from companies
  const availableParroquias = Array.from(
    new Set(companies.map((c) => c.parroquia).filter(Boolean))
  ).sort();
  
  const availableCnaes = Array.from(
    new Set(companies.map((c) => c.cnae).filter(Boolean))
  ).sort();
  
  const availableSectors = Array.from(
    new Set(companies.map((c) => c.sector).filter(Boolean))
  ).sort();

  const handleSearchResult = (result: any) => {
    if (result.type === 'company' && result.company) {
      // If it's a company, select it and close search
      setSelectedCompany(result.company);
      setSidebarOpen(true);
      setSearchLocation({
        lat: result.lat,
        lon: result.lon,
        name: result.name,
      });
      toast.success(`Empresa encontrada: ${result.name}`);
    } else {
      // If it's a place, just show it on the map
      setSearchLocation({
        lat: result.lat,
        lon: result.lon,
        name: result.name,
      });
      toast.success(`Ubicación encontrada: ${result.name}`);
    }
    setShowSearch(false);
  };

  const handleUpdateCompanyLocation = async (companyId: string, lat: number, lng: number) => {
    const { error } = await supabase
      .from('companies')
      .update({ latitude: lat, longitude: lng })
      .eq('id', companyId);

    if (error) {
      throw error;
    }

    // Update local state
    setCompanies(prev => prev.map(c => 
      c.id === companyId 
        ? { ...c, latitude: lat, longitude: lng }
        : c
    ));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <MapHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        mapStyle={mapStyle}
        view3D={view3D}
        onMapStyleChange={setMapStyle}
        onView3DChange={setView3D}
        baseLayers={baseLayers}
        onBaseLayersChange={setBaseLayers}
        buildingOpacity={buildingOpacity}
        onBuildingOpacityChange={setBuildingOpacity}
        buildingHeightMultiplier={buildingHeightMultiplier}
        onBuildingHeightMultiplierChange={setBuildingHeightMultiplier}
        statusColors={statusColors}
        products={products}
        filters={filters}
        onFiltersChange={setFilters}
        availableParroquias={availableParroquias}
        availableCnaes={availableCnaes}
        availableSectors={availableSectors}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        markerStyle={markerStyle}
        onMarkerStyleChange={(style) => {
          setMarkerStyle(style);
          localStorage.setItem('markerStyle', style);
        }}
        minZoomVinculacion={minZoomVinculacion}
        onMinZoomVinculacionChange={(zoom) => {
          setMinZoomVinculacion(zoom);
          localStorage.setItem('minZoomVinculacion', zoom.toString());
        }}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={onGoBack}
        onGoForward={onGoForward}
      />
      
      <div className="flex flex-1 min-h-0 h-full relative">
        <MapSidebar
          open={sidebarOpen}
          companies={companies}
          statusColors={statusColors}
          products={products}
          filters={filters}
          onFiltersChange={setFilters}
          selectedCompany={selectedCompany}
          onSelectCompany={setSelectedCompany}
          fullscreen={sidebarFullscreen}
          onFullscreenChange={setSidebarFullscreen}
        />
        
        {!sidebarFullscreen && (
          <div className="relative flex-1">
            {showSearch && (
              <GeoSearch
                companies={companies}
                onSelectResult={handleSearchResult}
                onClose={() => setShowSearch(false)}
              />
            )}
            
            {!showSearch && (
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Button
                  onClick={() => setShowSearch(true)}
                  className="shadow-lg"
                  size="default"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Buscar ubicación
                </Button>
                <Button
                  onClick={() => setShowRoutePlanner(true)}
                  variant={showRoutePlanner ? "default" : "outline"}
                  className="shadow-lg"
                  size="default"
                >
                  <Route className="mr-2 h-4 w-4" />
                  Planificar Ruta
                </Button>
              </div>
            )}

            <MapContainer
              companies={companies}
              statusColors={statusColors}
              filters={filters}
              onSelectCompany={(company) => {
                if (showRoutePlanner && company) {
                  // When route planner is open, add company to route
                  setRoutePlannerCompany(company);
                } else {
                  setSelectedCompany(company);
                  if (company) {
                    setSidebarOpen(true);
                  }
                }
              }}
              onUpdateCompanyLocation={handleUpdateCompanyLocation}
              mapStyle={mapStyle}
              view3D={view3D}
              baseLayers={baseLayers}
              buildingOpacity={buildingOpacity}
              buildingHeightMultiplier={buildingHeightMultiplier}
              searchLocation={searchLocation}
              onSearchLocationClear={() => setSearchLocation(null)}
              colorMode={colorMode}
              markerStyle={markerStyle}
              minZoomVinculacion={minZoomVinculacion}
              onMinZoomVinculacionChange={(zoom) => {
                setMinZoomVinculacion(zoom);
                localStorage.setItem('minZoomVinculacion', zoom.toString());
              }}
              focusCompanyId={focusCompanyId}
              onFocusCompanyHandled={() => setFocusCompanyId(null)}
            />

            {showRoutePlanner && (
              <RoutePlanner
                companies={companies}
                onRouteCalculated={(route) => {
                  setRoutePolyline(route?.polyline || null);
                }}
                onClose={() => {
                  setShowRoutePlanner(false);
                  setRoutePolyline(null);
                  setRoutePlannerCompany(null);
                }}
                selectedCompanyFromMap={routePlannerCompany}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
