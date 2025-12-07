import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompanyWithDetails, StatusColor, Profile } from '@/types/database';

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface Filters {
  search: string;
  tags: string[];
  sortBy: string;
  statusId?: string;
  gestorId?: string;
  oficina?: string;
}

interface UseCompaniesServerPaginationProps {
  userId: string | undefined;
  userOficina: string | null;
  isAuditor: boolean;
  isSuperAdmin: boolean;
  isCommercialDirector: boolean;
  isCommercialManager: boolean;
  isOfficeDirector: boolean;
}

interface UseCompaniesServerPaginationReturn {
  companies: CompanyWithDetails[];
  loading: boolean;
  pagination: PaginationState;
  filters: Filters;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: Partial<Filters>) => void;
  refetch: () => Promise<void>;
  statusColors: StatusColor[];
  gestores: Profile[];
  parroquias: string[];
  oficinas: any[];
  products: any[];
  allTags: string[];
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export function useCompaniesServerPagination({
  userId,
  userOficina,
  isAuditor,
  isSuperAdmin,
  isCommercialDirector,
  isCommercialManager,
  isOfficeDirector,
}: UseCompaniesServerPaginationProps): UseCompaniesServerPaginationReturn {
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusColors, setStatusColors] = useState<StatusColor[]>([]);
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [parroquias, setParroquias] = useState<string[]>([]);
  const [oficinas, setOficinas] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
  });

  const [filters, setFiltersState] = useState<Filters>({
    search: '',
    tags: [],
    sortBy: 'name-asc',
    statusId: undefined,
    gestorId: undefined,
    oficina: undefined,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load reference data (status, gestores, etc.) once
  const loadReferenceData = useCallback(async () => {
    if (!userId) return;

    try {
      const [statusRes, gestoresRes, conceptsRes, productsRes, oficinasRes] = await Promise.all([
        supabase.from('status_colors').select('*').order('display_order'),
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('concepts').select('*').eq('concept_type', 'parroquia').eq('active', true),
        supabase.from('products').select('*').eq('active', true).order('category, name'),
        supabase.from('concepts').select('*').eq('concept_type', 'oficina').eq('active', true),
      ]);

      if (statusRes.data) setStatusColors(statusRes.data);
      if (gestoresRes.data) setGestores(gestoresRes.data);
      if (conceptsRes.data) setParroquias(conceptsRes.data.map((c: any) => c.concept_value));
      if (productsRes.data) setProducts(productsRes.data);
      if (oficinasRes.data) setOficinas(oficinasRes.data);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  }, [userId]);

  // Load tags separately with optimization
  const loadAllTags = useCallback(async () => {
    if (!userId) return;

    try {
      // Use distinct query optimization
      const { data, error } = await supabase
        .from('companies')
        .select('tags')
        .not('tags', 'is', null);

      if (error) throw error;

      const tagsSet = new Set<string>();
      data?.forEach(company => {
        if (company.tags && Array.isArray(company.tags)) {
          company.tags.forEach((tag: string) => tagsSet.add(tag));
        }
      });

      setAllTags(Array.from(tagsSet).sort());
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }, [userId]);

  // Main fetch with server-side pagination and filtering
  const fetchCompanies = useCallback(async () => {
    if (!userId || isAuditor) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);

    try {
      // Build base query
      let countQuery = supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('companies')
        .select('*, status_colors(*), profiles(*)');

      // Apply role-based filtering
      if (!isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
        if (isOfficeDirector && userOficina) {
          countQuery = countQuery.eq('oficina', userOficina);
          dataQuery = dataQuery.eq('oficina', userOficina);
        } else {
          countQuery = countQuery.eq('gestor_id', userId);
          dataQuery = dataQuery.eq('gestor_id', userId);
        }
      }

      // Apply search filter - server-side
      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        countQuery = countQuery.or(`name.ilike.${searchPattern},address.ilike.${searchPattern},parroquia.ilike.${searchPattern},phone.ilike.${searchPattern},email.ilike.${searchPattern},tax_id.ilike.${searchPattern}`);
        dataQuery = dataQuery.or(`name.ilike.${searchPattern},address.ilike.${searchPattern},parroquia.ilike.${searchPattern},phone.ilike.${searchPattern},email.ilike.${searchPattern},tax_id.ilike.${searchPattern}`);
      }

      // Apply status filter
      if (filters.statusId) {
        countQuery = countQuery.eq('status_id', filters.statusId);
        dataQuery = dataQuery.eq('status_id', filters.statusId);
      }

      // Apply gestor filter
      if (filters.gestorId) {
        countQuery = countQuery.eq('gestor_id', filters.gestorId);
        dataQuery = dataQuery.eq('gestor_id', filters.gestorId);
      }

      // Apply oficina filter
      if (filters.oficina) {
        countQuery = countQuery.eq('oficina', filters.oficina);
        dataQuery = dataQuery.eq('oficina', filters.oficina);
      }

      // Apply tags filter (contains all selected tags)
      if (filters.tags.length > 0) {
        countQuery = countQuery.contains('tags', filters.tags);
        dataQuery = dataQuery.contains('tags', filters.tags);
      }

      // Apply sorting
      const sortMapping: Record<string, { column: string; ascending: boolean }> = {
        'name-asc': { column: 'name', ascending: true },
        'name-desc': { column: 'name', ascending: false },
        'linkage-desc': { column: 'vinculacion_entidad_1', ascending: false },
        'linkage-asc': { column: 'vinculacion_entidad_1', ascending: true },
        'visit-desc': { column: 'fecha_ultima_visita', ascending: false },
        'visit-asc': { column: 'fecha_ultima_visita', ascending: true },
      };

      const sortConfig = sortMapping[filters.sortBy] || sortMapping['name-asc'];
      dataQuery = dataQuery.order(sortConfig.column, { ascending: sortConfig.ascending, nullsFirst: false });

      // Apply pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      dataQuery = dataQuery.range(from, to);

      // Execute queries in parallel
      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery,
      ]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      const totalCount = countResult.count || 0;
      const totalPages = Math.ceil(totalCount / pagination.pageSize);

      setCompanies(dataResult.data as CompanyWithDetails[]);
      setPagination(prev => ({
        ...prev,
        totalCount,
        totalPages,
      }));
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    userOficina,
    isAuditor,
    isSuperAdmin,
    isCommercialDirector,
    isCommercialManager,
    isOfficeDirector,
    filters,
    pagination.page,
    pagination.pageSize,
  ]);

  // Initialize
  useEffect(() => {
    if (userId) {
      loadReferenceData();
      loadAllTags();
    }
  }, [userId, loadReferenceData, loadAllTags]);

  // Fetch companies when filters or pagination change
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Handlers
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const setFilters = useCallback((newFilters: Partial<Filters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([fetchCompanies(), loadAllTags()]);
  }, [fetchCompanies, loadAllTags]);

  return {
    companies,
    loading,
    pagination,
    filters,
    setPage,
    setPageSize,
    setFilters,
    refetch,
    statusColors,
    gestores,
    parroquias,
    oficinas,
    products,
    allTags,
  };
}
