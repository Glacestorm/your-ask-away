import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MapContainer } from '@/components/map/MapContainer';
import { MapControls } from '@/components/map/MapControls';
import { MapSidebar } from '@/components/map/MapSidebar';
import { MapHeader } from '@/components/map/MapHeader';
import { CompanyWithDetails, MapFilters, StatusColor, Product } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
    productIds: [],
    dateRange: null,
    searchTerm: '',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithDetails | null>(null);

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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <MapHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
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
          <MapContainer
            companies={companies}
            statusColors={statusColors}
            filters={filters}
            onSelectCompany={setSelectedCompany}
          />
          
          <MapControls
            statusColors={statusColors}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>
    </div>
  );
};

export default MapView;
