import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MapContainer } from '@/components/map/MapContainer';
import { MapSidebar } from '@/components/map/MapSidebar';
import { MapHeader, MapBaseLayers } from '@/components/map/MapHeader';
import { GeoSearch } from '@/components/map/GeoSearch';
import { CompanyWithDetails, MapFilters, StatusColor, Product, MapColorMode } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const MapView = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
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

      if (companiesError) throw companiesError;

      // Fetch products for each company
      const companiesWithProducts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { data: productsData } = await supabase
            .from('company_products')
            .select('product_id, products(*)')
            .eq('company_id', company.id)
            .eq('active', true);

          return {
            ...company,
            products: productsData?.map((cp: any) => cp.products).filter(Boolean) || [],
          };
        })
      );

      setCompanies(companiesWithProducts as CompanyWithDetails[]);

      // Fetch status colors
      const { data: statusData, error: statusError } = await supabase
        .from('status_colors')
        .select('*')
        .order('display_order');

      if (statusError) throw statusError;
      setStatusColors(statusData || []);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
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
      />
      
      <div className="relative flex flex-1 overflow-hidden">
        <MapSidebar
          open={sidebarOpen}
          companies={companies}
          statusColors={statusColors}
          products={products}
          filters={filters}
          onFiltersChange={setFilters}
          selectedCompany={selectedCompany}
          onSelectCompany={setSelectedCompany}
        />
        
        <div className="relative flex-1">
          {showSearch && (
            <GeoSearch
              companies={companies}
              onSelectResult={handleSearchResult}
              onClose={() => setShowSearch(false)}
            />
          )}
          
          {!showSearch && (
            <Button
              onClick={() => setShowSearch(true)}
              className="absolute top-4 left-4 z-10 shadow-lg"
              size="default"
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar ubicación
            </Button>
          )}

          <MapContainer
            companies={companies}
            statusColors={statusColors}
            filters={filters}
            onSelectCompany={setSelectedCompany}
            mapStyle={mapStyle}
            view3D={view3D}
            baseLayers={baseLayers}
            buildingOpacity={buildingOpacity}
            buildingHeightMultiplier={buildingHeightMultiplier}
            searchLocation={searchLocation}
            onSearchLocationClear={() => setSearchLocation(null)}
            colorMode={colorMode}
          />
          
        </div>
      </div>
    </div>
  );
};

export default MapView;
