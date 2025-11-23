import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { subMonths, format } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Building2, Users, TrendingUp, GitCompare, Table as TableIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';

interface GestorMetrics {
  id: string;
  name: string;
  oficina: string;
  totalVisits: number;
  successfulVisits: number;
  successRate: number;
  companiesManaged: number;
}

interface OficinaMetrics {
  oficina: string;
  totalVisits: number;
  successfulVisits: number;
  successRate: number;
  gestoresCount: number;
  companiesCount: number;
}

interface BancoMetrics {
  totalVisits: number;
  successfulVisits: number;
  successRate: number;
  oficinasCount: number;
  gestoresCount: number;
  companiesCount: number;
}

interface ResponsableMetrics {
  responsable: string;
  totalVisits: number;
  successfulVisits: number;
  successRate: number;
  gestoresCount: number;
  companiesCount: number;
}

interface MetricsExplorerProps {
  restrictToOficina?: string | null;
}

export function MetricsExplorer({ restrictToOficina }: MetricsExplorerProps = {}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 1), to: today };
  });
  
  // Gestor level
  const [gestores, setGestores] = useState<{ id: string; name: string; oficina: string }[]>([]);
  const [selectedGestor, setSelectedGestor] = useState<string>('');
  const [gestorMetrics, setGestorMetrics] = useState<GestorMetrics | null>(null);
  
  // Oficina level
  const [oficinas, setOficinas] = useState<string[]>([]);
  const [selectedOficina, setSelectedOficina] = useState<string>('');
  const [oficinaMetrics, setOficinaMetrics] = useState<OficinaMetrics | null>(null);
  
  // Banco level
  const [bancoMetrics, setBancoMetrics] = useState<BancoMetrics | null>(null);

  // Responsable Comercial level
  const [responsables, setResponsables] = useState<string[]>([]);
  const [selectedResponsable, setSelectedResponsable] = useState<string>('');
  const [responsableMetrics, setResponsableMetrics] = useState<ResponsableMetrics | null>(null);

  // Comparison
  const [selectedGestoresForCompare, setSelectedGestoresForCompare] = useState<string[]>([]);
  const [selectedOficinasForCompare, setSelectedOficinasForCompare] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [temporalComparisonData, setTemporalComparisonData] = useState<any[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [compareType, setCompareType] = useState<'gestores' | 'oficinas'>('gestores');
  
  // Filters
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedTurnoverRange, setSelectedTurnoverRange] = useState<string>('all');

  useEffect(() => {
    loadGestoresAndOficinas();
    loadSectors();
    loadResponsables();
    // Si hay restricción de oficina, pre-seleccionarla
    if (restrictToOficina) {
      setSelectedOficina(restrictToOficina);
    }
  }, [restrictToOficina]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      if (selectedGestor) loadGestorMetrics();
    }
  }, [dateRange, selectedGestor]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      if (selectedOficina) loadOficinaMetrics();
    }
  }, [dateRange, selectedOficina]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      loadBancoMetrics();
    }
  }, [dateRange]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      if (selectedResponsable) loadResponsableMetrics();
    }
  }, [dateRange, selectedResponsable]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      if (compareType === 'gestores' && selectedGestoresForCompare.length > 0) {
        loadComparisonData();
      } else if (compareType === 'oficinas' && selectedOficinasForCompare.length > 0) {
        loadComparisonData();
      }
    }
  }, [dateRange, selectedGestoresForCompare, selectedOficinasForCompare, compareType, selectedSector, selectedTurnoverRange]);

  const loadGestoresAndOficinas = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, oficina')
        .order('full_name');

      // Si hay restricción de oficina, filtrar solo gestores de esa oficina
      if (restrictToOficina) {
        query = query.eq('oficina', restrictToOficina);
      }

      const { data: profiles } = await query;

      if (profiles) {
        const gestoresList = profiles.map(p => ({
          id: p.id,
          name: p.full_name || p.email.split('@')[0],
          oficina: p.oficina || 'Sin asignar'
        }));
        setGestores(gestoresList);

        const oficinasSet = new Set(profiles.map(p => p.oficina || 'Sin asignar'));
        setOficinas(Array.from(oficinasSet).sort());
      }
    } catch (error) {
      console.error('Error loading gestores:', error);
      toast.error('Error al cargar gestores');
    }
  };

  const loadSectors = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('sector')
        .not('sector', 'is', null);

      if (companies) {
        const sectorsSet = new Set(companies.map(c => c.sector).filter(Boolean));
        setSectors(Array.from(sectorsSet).sort());
      }
    } catch (error) {
      console.error('Error loading sectors:', error);
    }
  };

  const loadResponsables = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('cargo', 'Responsable Comercial')
        .order('full_name');

      if (profiles) {
        const responsablesList = profiles.map(p => p.full_name || p.email.split('@')[0]);
        setResponsables([...new Set(responsablesList)].sort());
      }
    } catch (error) {
      console.error('Error loading responsables:', error);
      toast.error('Error al cargar responsables comerciales');
    }
  };

  const loadGestorMetrics = async () => {
    if (!selectedGestor || !dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Get gestor info
      const gestor = gestores.find(g => g.id === selectedGestor);
      if (!gestor) return;

      // Count visits
      const { count: totalVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', selectedGestor)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count successful visits
      const { count: successfulVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', selectedGestor)
        .eq('result', 'Exitosa')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count companies
      const { count: companiesManaged } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', selectedGestor);

      const visits = totalVisits || 0;
      const successful = successfulVisits || 0;

      setGestorMetrics({
        id: gestor.id,
        name: gestor.name,
        oficina: gestor.oficina,
        totalVisits: visits,
        successfulVisits: successful,
        successRate: visits > 0 ? Math.round((successful / visits) * 100) : 0,
        companiesManaged: companiesManaged || 0
      });
    } catch (error) {
      console.error('Error loading gestor metrics:', error);
      toast.error('Error al cargar métricas del gestor');
    } finally {
      setLoading(false);
    }
  };

  const loadOficinaMetrics = async () => {
    if (!selectedOficina || !dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Get all gestores from this oficina
      const gestoresInOficina = gestores.filter(g => g.oficina === selectedOficina);
      const gestorIds = gestoresInOficina.map(g => g.id);

      if (gestorIds.length === 0) {
        setOficinaMetrics({
          oficina: selectedOficina,
          totalVisits: 0,
          successfulVisits: 0,
          successRate: 0,
          gestoresCount: 0,
          companiesCount: 0
        });
        setLoading(false);
        return;
      }

      // Count visits from all gestores in oficina
      const { count: totalVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestorIds)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count successful visits
      const { count: successfulVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestorIds)
        .eq('result', 'Exitosa')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count companies managed by gestores in this oficina
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestorIds);

      const visits = totalVisits || 0;
      const successful = successfulVisits || 0;

      setOficinaMetrics({
        oficina: selectedOficina,
        totalVisits: visits,
        successfulVisits: successful,
        successRate: visits > 0 ? Math.round((successful / visits) * 100) : 0,
        gestoresCount: gestorIds.length,
        companiesCount: companiesCount || 0
      });
    } catch (error) {
      console.error('Error loading oficina metrics:', error);
      toast.error('Error al cargar métricas de la oficina');
    } finally {
      setLoading(false);
    }
  };

  const loadBancoMetrics = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Count all visits in period
      const { count: totalVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count successful visits
      const { count: successfulVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('result', 'Exitosa')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count companies
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      const visits = totalVisits || 0;
      const successful = successfulVisits || 0;

      setBancoMetrics({
        totalVisits: visits,
        successfulVisits: successful,
        successRate: visits > 0 ? Math.round((successful / visits) * 100) : 0,
        oficinasCount: oficinas.length,
        gestoresCount: gestores.length,
        companiesCount: companiesCount || 0
      });
    } catch (error) {
      console.error('Error loading banco metrics:', error);
      toast.error('Error al cargar métricas del banco');
    } finally {
      setLoading(false);
    }
  };

  const loadResponsableMetrics = async () => {
    if (!selectedResponsable || !dateRange?.from || !dateRange?.to) return;
    
    setLoading(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Get all gestores with this cargo
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('cargo', 'Responsable Comercial');

      const gestoresResponsables = profiles?.filter(p => 
        (p.full_name || p.email.split('@')[0]) === selectedResponsable
      ).map(p => p.id) || [];

      if (gestoresResponsables.length === 0) {
        setResponsableMetrics({
          responsable: selectedResponsable,
          totalVisits: 0,
          successfulVisits: 0,
          successRate: 0,
          gestoresCount: 0,
          companiesCount: 0
        });
        setLoading(false);
        return;
      }

      // Count visits from all gestores with this cargo
      const { count: totalVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestoresResponsables)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count successful visits
      const { count: successfulVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestoresResponsables)
        .eq('result', 'Exitosa')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Count companies managed by these gestores
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .in('gestor_id', gestoresResponsables);

      const visits = totalVisits || 0;
      const successful = successfulVisits || 0;

      setResponsableMetrics({
        responsable: selectedResponsable,
        totalVisits: visits,
        successfulVisits: successful,
        successRate: visits > 0 ? Math.round((successful / visits) * 100) : 0,
        gestoresCount: gestoresResponsables.length,
        companiesCount: companiesCount || 0
      });
    } catch (error) {
      console.error('Error loading responsable metrics:', error);
      toast.error('Error al cargar métricas del responsable comercial');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCompanyIds = async (gestorIds: string[]) => {
    let query = supabase
      .from('companies')
      .select('id')
      .in('gestor_id', gestorIds);

    if (selectedSector !== 'all') {
      query = query.eq('sector', selectedSector);
    }

    if (selectedTurnoverRange !== 'all') {
      const [min, max] = selectedTurnoverRange.split('-').map(Number);
      if (max) {
        query = query.gte('turnover', min).lte('turnover', max);
      } else {
        query = query.gte('turnover', min);
      }
    }

    const { data } = await query;
    return data?.map(c => c.id) || [];
  };

  const loadComparisonData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setComparisonLoading(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      if (compareType === 'gestores' && selectedGestoresForCompare.length > 0) {
        // Load total metrics
        const metricsPromises = selectedGestoresForCompare.map(async (gestorId) => {
          const gestor = gestores.find(g => g.id === gestorId);
          if (!gestor) return null;

          // Get filtered company IDs
          const filteredCompanyIds = await getFilteredCompanyIds([gestorId]);

          let totalVisitsQuery = supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('gestor_id', gestorId)
            .gte('visit_date', fromDate)
            .lte('visit_date', toDate);

          let successfulVisitsQuery = supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('gestor_id', gestorId)
            .eq('result', 'Exitosa')
            .gte('visit_date', fromDate)
            .lte('visit_date', toDate);

          // Apply company filter if filters are active
          if (filteredCompanyIds.length > 0 && (selectedSector !== 'all' || selectedTurnoverRange !== 'all')) {
            totalVisitsQuery = totalVisitsQuery.in('company_id', filteredCompanyIds);
            successfulVisitsQuery = successfulVisitsQuery.in('company_id', filteredCompanyIds);
          } else if (selectedSector !== 'all' || selectedTurnoverRange !== 'all') {
            // No companies match filters, return 0
            return {
              name: gestor.name,
              visitas: 0,
              exitosas: 0,
              tasaExito: 0
            };
          }

          const { count: totalVisits } = await totalVisitsQuery;
          const { count: successfulVisits } = await successfulVisitsQuery;

          const visits = totalVisits || 0;
          const successful = successfulVisits || 0;

          return {
            name: gestor.name,
            visitas: visits,
            exitosas: successful,
            tasaExito: visits > 0 ? Math.round((successful / visits) * 100) : 0
          };
        });

        const results = await Promise.all(metricsPromises);
        setComparisonData(results.filter(r => r !== null));

        // Load temporal evolution (month by month)
        const temporalPromises = selectedGestoresForCompare.map(async (gestorId) => {
          const gestor = gestores.find(g => g.id === gestorId);
          if (!gestor) return null;

          const filteredCompanyIds = await getFilteredCompanyIds([gestorId]);

          let visitsQuery = supabase
            .from('visits')
            .select('visit_date, result, company_id')
            .eq('gestor_id', gestorId)
            .gte('visit_date', fromDate)
            .lte('visit_date', toDate)
            .order('visit_date');

          if (filteredCompanyIds.length > 0 && (selectedSector !== 'all' || selectedTurnoverRange !== 'all')) {
            visitsQuery = visitsQuery.in('company_id', filteredCompanyIds);
          } else if (selectedSector !== 'all' || selectedTurnoverRange !== 'all') {
            return { gestorId, gestorName: gestor.name, visits: [] };
          }

          const { data: visits } = await visitsQuery;

          return { gestorId, gestorName: gestor.name, visits: visits || [] };
        });

        const temporalResults = await Promise.all(temporalPromises);
        const validResults = temporalResults.filter(r => r !== null);

        // Group by month
        const monthsMap = new Map<string, any>();
        
        validResults.forEach((result) => {
          result.visits.forEach((visit: any) => {
            const monthKey = format(new Date(visit.visit_date), 'yyyy-MM');
            
            if (!monthsMap.has(monthKey)) {
              monthsMap.set(monthKey, { month: monthKey });
            }
            
            const monthData = monthsMap.get(monthKey);
            if (!monthData[`${result.gestorName}_visitas`]) {
              monthData[`${result.gestorName}_visitas`] = 0;
            }
            if (!monthData[`${result.gestorName}_exitosas`]) {
              monthData[`${result.gestorName}_exitosas`] = 0;
            }
            
            monthData[`${result.gestorName}_visitas`]++;
            if (visit.result === 'Exitosa') {
              monthData[`${result.gestorName}_exitosas`]++;
            }
          });
        });

        const temporalData = Array.from(monthsMap.values())
          .sort((a, b) => a.month.localeCompare(b.month))
          .map(item => ({
            ...item,
            monthLabel: format(new Date(item.month + '-01'), 'MMM yyyy')
          }));

        setTemporalComparisonData(temporalData);

      } else if (compareType === 'oficinas' && selectedOficinasForCompare.length > 0) {
        // Load total metrics
        const metricsPromises = selectedOficinasForCompare.map(async (oficina) => {
          const gestoresInOficina = gestores.filter(g => g.oficina === oficina);
          const gestorIds = gestoresInOficina.map(g => g.id);

          if (gestorIds.length === 0) {
            return {
              name: oficina,
              visitas: 0,
              exitosas: 0,
              tasaExito: 0
            };
          }

          const filteredCompanyIds = await getFilteredCompanyIds(gestorIds);

          let totalVisitsQuery = supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .in('gestor_id', gestorIds)
            .gte('visit_date', fromDate)
            .lte('visit_date', toDate);

          let successfulVisitsQuery = supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .in('gestor_id', gestorIds)
            .eq('result', 'Exitosa')
            .gte('visit_date', fromDate)
            .lte('visit_date', toDate);

          if (filteredCompanyIds.length > 0 && (selectedSector !== 'all' || selectedTurnoverRange !== 'all')) {
            totalVisitsQuery = totalVisitsQuery.in('company_id', filteredCompanyIds);
            successfulVisitsQuery = successfulVisitsQuery.in('company_id', filteredCompanyIds);
          } else if (selectedSector !== 'all' || selectedTurnoverRange !== 'all') {
            return {
              name: oficina,
              visitas: 0,
              exitosas: 0,
              tasaExito: 0
            };
          }

          const { count: totalVisits } = await totalVisitsQuery;
          const { count: successfulVisits } = await successfulVisitsQuery;

          const visits = totalVisits || 0;
          const successful = successfulVisits || 0;

          return {
            name: oficina,
            visitas: visits,
            exitosas: successful,
            tasaExito: visits > 0 ? Math.round((successful / visits) * 100) : 0
          };
        });

        const results = await Promise.all(metricsPromises);
        setComparisonData(results);

        // Load temporal evolution (month by month)
        const temporalPromises = selectedOficinasForCompare.map(async (oficina) => {
          const gestoresInOficina = gestores.filter(g => g.oficina === oficina);
          const gestorIds = gestoresInOficina.map(g => g.id);

          if (gestorIds.length === 0) return null;

          const filteredCompanyIds = await getFilteredCompanyIds(gestorIds);

          let visitsQuery = supabase
            .from('visits')
            .select('visit_date, result, company_id')
            .in('gestor_id', gestorIds)
            .gte('visit_date', fromDate)
            .lte('visit_date', toDate)
            .order('visit_date');

          if (filteredCompanyIds.length > 0 && (selectedSector !== 'all' || selectedTurnoverRange !== 'all')) {
            visitsQuery = visitsQuery.in('company_id', filteredCompanyIds);
          } else if (selectedSector !== 'all' || selectedTurnoverRange !== 'all') {
            return { oficina, visits: [] };
          }

          const { data: visits } = await visitsQuery;

          return { oficina, visits: visits || [] };
        });

        const temporalResults = await Promise.all(temporalPromises);
        const validResults = temporalResults.filter(r => r !== null);

        // Group by month
        const monthsMap = new Map<string, any>();
        
        validResults.forEach((result) => {
          result.visits.forEach((visit: any) => {
            const monthKey = format(new Date(visit.visit_date), 'yyyy-MM');
            
            if (!monthsMap.has(monthKey)) {
              monthsMap.set(monthKey, { month: monthKey });
            }
            
            const monthData = monthsMap.get(monthKey);
            if (!monthData[`${result.oficina}_visitas`]) {
              monthData[`${result.oficina}_visitas`] = 0;
            }
            if (!monthData[`${result.oficina}_exitosas`]) {
              monthData[`${result.oficina}_exitosas`] = 0;
            }
            
            monthData[`${result.oficina}_visitas`]++;
            if (visit.result === 'Exitosa') {
              monthData[`${result.oficina}_exitosas`]++;
            }
          });
        });

        const temporalData = Array.from(monthsMap.values())
          .sort((a, b) => a.month.localeCompare(b.month))
          .map(item => ({
            ...item,
            monthLabel: format(new Date(item.month + '-01'), 'MMM yyyy')
          }));

        setTemporalComparisonData(temporalData);
      }
    } catch (error) {
      console.error('Error loading comparison data:', error);
      toast.error('Error al cargar datos de comparación');
    } finally {
      setComparisonLoading(false);
    }
  };

  const toggleGestorSelection = (gestorId: string) => {
    setSelectedGestoresForCompare(prev =>
      prev.includes(gestorId)
        ? prev.filter(id => id !== gestorId)
        : [...prev, gestorId]
    );
  };

  const toggleOficinaSelection = (oficina: string) => {
    setSelectedOficinasForCompare(prev =>
      prev.includes(oficina)
        ? prev.filter(o => o !== oficina)
        : [...prev, oficina]
    );
  };

  const MetricsCards = ({ metrics, type }: { metrics: any; type: 'gestor' | 'oficina' | 'banco' | 'responsable' }) => {
    if (!metrics) return null;

    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.totalVisits')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.successfulVisits} {t('stats.successful')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.successRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {t('metrics.totalVisitsLabel').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {type === 'gestor' ? t('metrics.companiesManaged') : 
               type === 'oficina' || type === 'responsable' ? t('metrics.managersCompanies') : t('metrics.officesManagers')}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {type === 'gestor' ? metrics.companiesManaged :
               type === 'oficina' || type === 'responsable' ? `${metrics.gestoresCount}/${metrics.companiesCount}` :
               `${metrics.oficinasCount}/${metrics.gestoresCount}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {type === 'gestor' ? t('metrics.inPortfolio') :
               type === 'oficina' || type === 'responsable' ? `${t('stats.managers')} ${t('common.and')} ${t('stats.companies')}` : 
               t('metrics.totalCoverage')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('metrics.title')}</CardTitle>
          <CardDescription>
            {t('metrics.subtitle')}
          </CardDescription>
        </CardHeader>
      </Card>

      <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

      <Tabs defaultValue="gestor" className="space-y-4">
        <TabsList className={`grid w-full ${restrictToOficina ? 'grid-cols-4' : 'grid-cols-5'}`}>
          <TabsTrigger value="gestor">
            <Users className="mr-2 h-4 w-4" />
            {t('metrics.byManager')}
          </TabsTrigger>
          <TabsTrigger value="responsable">
            <Users className="mr-2 h-4 w-4" />
            {t('metrics.byCommercial')}
          </TabsTrigger>
          <TabsTrigger value="oficina">
            <Building2 className="mr-2 h-4 w-4" />
            {t('metrics.byOffice')}
          </TabsTrigger>
          {!restrictToOficina && (
            <TabsTrigger value="banco">
              <TrendingUp className="mr-2 h-4 w-4" />
              {t('metrics.totalBank')}
            </TabsTrigger>
          )}
          <TabsTrigger value="compare">
            <GitCompare className="mr-2 h-4 w-4" />
            {t('metrics.compare')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gestor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('metrics.selectManager')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedGestor} onValueChange={setSelectedGestor}>
                <SelectTrigger>
                  <SelectValue placeholder={t('metrics.selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {gestores.map(gestor => (
                    <SelectItem key={gestor.id} value={gestor.id}>
                      {gestor.name} ({gestor.oficina})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading && <Skeleton className="h-32 w-full" />}
          {!loading && gestorMetrics && (
            <>
              <MetricsCards metrics={gestorMetrics} type="gestor" />
              <Card>
                <CardHeader>
                  <CardTitle>{t('metrics.managerInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('company.name')}:</dt>
                      <dd className="font-medium">{gestorMetrics.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('company.office')}:</dt>
                      <dd className="font-medium">{gestorMetrics.oficina}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="responsable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('metrics.selectCommercial')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedResponsable} onValueChange={setSelectedResponsable}>
                <SelectTrigger>
                  <SelectValue placeholder={t('metrics.selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {responsables.map(responsable => (
                    <SelectItem key={responsable} value={responsable}>
                      {responsable}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading && <Skeleton className="h-32 w-full" />}
          {!loading && responsableMetrics && (
            <MetricsCards metrics={responsableMetrics} type="responsable" />
          )}
        </TabsContent>

        <TabsContent value="oficina" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('metrics.selectOffice')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedOficina} onValueChange={setSelectedOficina}>
                <SelectTrigger>
                  <SelectValue placeholder={t('metrics.selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {oficinas.map(oficina => (
                    <SelectItem key={oficina} value={oficina}>
                      {oficina}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading && <Skeleton className="h-32 w-full" />}
          {!loading && oficinaMetrics && (
            <MetricsCards metrics={oficinaMetrics} type="oficina" />
          )}
        </TabsContent>

        <TabsContent value="banco" className="space-y-4">
          {loading && <Skeleton className="h-32 w-full" />}
          {!loading && bancoMetrics && (
            <MetricsCards metrics={bancoMetrics} type="banco" />
          )}
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparar Métricas</CardTitle>
              <CardDescription>
                Selecciona múltiples gestores u oficinas para comparar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Filtrar por Sector</Label>
                  <Select value={selectedSector} onValueChange={setSelectedSector}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los sectores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los sectores</SelectItem>
                      {sectors.map(sector => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Filtrar por Facturación</Label>
                  <Select value={selectedTurnoverRange} onValueChange={setSelectedTurnoverRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los rangos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los rangos</SelectItem>
                      <SelectItem value="0-100000">Menos de 100K €</SelectItem>
                      <SelectItem value="100000-500000">100K - 500K €</SelectItem>
                      <SelectItem value="500000-1000000">500K - 1M €</SelectItem>
                      <SelectItem value="1000000-5000000">1M - 5M €</SelectItem>
                      <SelectItem value="5000000">Más de 5M €</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Tabs value={compareType} onValueChange={(v) => setCompareType(v as 'gestores' | 'oficinas')}>
                {!restrictToOficina && (
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="gestores">Comparar Gestores</TabsTrigger>
                    <TabsTrigger value="oficinas">Comparar Oficinas</TabsTrigger>
                  </TabsList>
                )}
                {restrictToOficina && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium">Comparar Gestores de tu Oficina</h3>
                    <p className="text-xs text-muted-foreground">Selecciona gestores de {restrictToOficina}</p>
                  </div>
                )}

                <TabsContent value="gestores" className={`space-y-4 ${restrictToOficina ? '' : 'mt-4'}`}>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {selectedGestoresForCompare.length} gestor(es) seleccionado(s)
                    </p>
                    {selectedGestoresForCompare.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGestoresForCompare([])}
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-4">
                    {gestores.map((gestor) => (
                      <div key={gestor.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`gestor-${gestor.id}`}
                          checked={selectedGestoresForCompare.includes(gestor.id)}
                          onCheckedChange={() => toggleGestorSelection(gestor.id)}
                        />
                        <Label
                          htmlFor={`gestor-${gestor.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {gestor.name} ({gestor.oficina})
                        </Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="oficinas" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {selectedOficinasForCompare.length} oficina(s) seleccionada(s)
                    </p>
                    {selectedOficinasForCompare.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOficinasForCompare([])}
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-4">
                    {oficinas.map((oficina) => (
                      <div key={oficina} className="flex items-center space-x-2">
                        <Checkbox
                          id={`oficina-${oficina}`}
                          checked={selectedOficinasForCompare.includes(oficina)}
                          onCheckedChange={() => toggleOficinaSelection(oficina)}
                        />
                        <Label
                          htmlFor={`oficina-${oficina}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {oficina}
                        </Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {comparisonLoading && <Skeleton className="h-96 w-full" />}
          {!comparisonLoading && comparisonData.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="h-5 w-5" />
                    Tabla de Métricas Detalladas
                  </CardTitle>
                  <CardDescription>
                    Datos numéricos exactos de la comparación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">
                            {compareType === 'gestores' ? 'Gestor' : 'Oficina'}
                          </TableHead>
                          <TableHead className="text-right">Total Visitas</TableHead>
                          <TableHead className="text-right">Visitas Exitosas</TableHead>
                          <TableHead className="text-right">Visitas Fallidas</TableHead>
                          <TableHead className="text-right">Tasa de Éxito</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonData.map((item) => (
                          <TableRow key={item.name}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-right">{item.visitas}</TableCell>
                            <TableCell className="text-right text-green-600 dark:text-green-400">
                              {item.exitosas}
                            </TableCell>
                            <TableCell className="text-right text-red-600 dark:text-red-400">
                              {item.visitas - item.exitosas}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {item.tasaExito}%
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell>TOTAL</TableCell>
                          <TableCell className="text-right">
                            {comparisonData.reduce((sum, item) => sum + item.visitas, 0)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 dark:text-green-400">
                            {comparisonData.reduce((sum, item) => sum + item.exitosas, 0)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 dark:text-red-400">
                            {comparisonData.reduce((sum, item) => sum + (item.visitas - item.exitosas), 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {comparisonData.reduce((sum, item) => sum + item.visitas, 0) > 0
                              ? Math.round(
                                  (comparisonData.reduce((sum, item) => sum + item.exitosas, 0) /
                                    comparisonData.reduce((sum, item) => sum + item.visitas, 0)) *
                                    100
                                )
                              : 0}
                            %
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparación de Visitas</CardTitle>
                  <CardDescription>Total de visitas y exitosas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="visitas" fill="hsl(var(--chart-1))" name="Total Visitas" />
                      <Bar dataKey="exitosas" fill="hsl(var(--chart-2))" name="Visitas Exitosas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparación de Tasa de Éxito</CardTitle>
                  <CardDescription>Porcentaje de visitas exitosas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="tasaExito" fill="hsl(var(--chart-3))" name="Tasa de Éxito %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {temporalComparisonData.length > 0 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Estadísticas Comparativas
                      </CardTitle>
                      <CardDescription>
                        Análisis de rendimiento: promedio, mejor y peor mes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[150px]">
                                {compareType === 'gestores' ? 'Gestor' : 'Oficina'}
                              </TableHead>
                              <TableHead className="text-right">Promedio Conversión</TableHead>
                              <TableHead className="min-w-[120px]">Mejor Mes</TableHead>
                              <TableHead className="text-right">Tasa Mejor</TableHead>
                              <TableHead className="min-w-[120px]">Peor Mes</TableHead>
                              <TableHead className="text-right">Tasa Peor</TableHead>
                              <TableHead className="text-right">Variación</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(compareType === 'gestores' 
                              ? selectedGestoresForCompare.map(gestorId => {
                                  const gestor = gestores.find(g => g.id === gestorId);
                                  return gestor ? { id: gestorId, name: gestor.name } : null;
                                }).filter(Boolean)
                              : selectedOficinasForCompare.map(oficina => ({ id: oficina, name: oficina }))
                            ).map((entity: any) => {
                              // Calculate monthly conversion rates
                              const monthlyRates = temporalComparisonData.map(monthData => {
                                const visitas = monthData[`${entity.name}_visitas`] || 0;
                                const exitosas = monthData[`${entity.name}_exitosas`] || 0;
                                const rate = visitas > 0 ? (exitosas / visitas) * 100 : 0;
                                return {
                                  month: monthData.monthLabel,
                                  rate,
                                  visitas,
                                  exitosas
                                };
                              }).filter(m => m.visitas > 0); // Only months with visits

                              if (monthlyRates.length === 0) {
                                return (
                                  <TableRow key={entity.id}>
                                    <TableCell className="font-medium">{entity.name}</TableCell>
                                    <TableCell className="text-right text-muted-foreground" colSpan={6}>
                                      Sin datos suficientes
                                    </TableCell>
                                  </TableRow>
                                );
                              }

                              // Calculate statistics
                              const avgRate = monthlyRates.reduce((sum, m) => sum + m.rate, 0) / monthlyRates.length;
                              const bestMonth = monthlyRates.reduce((best, current) => 
                                current.rate > best.rate ? current : best
                              );
                              const worstMonth = monthlyRates.reduce((worst, current) => 
                                current.rate < worst.rate ? current : worst
                              );
                              const variation = bestMonth.rate - worstMonth.rate;

                              return (
                                <TableRow key={entity.id}>
                                  <TableCell className="font-medium">{entity.name}</TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {Math.round(avgRate)}%
                                  </TableCell>
                                  <TableCell className="text-green-600 dark:text-green-400">
                                    {bestMonth.month}
                                  </TableCell>
                                  <TableCell className="text-right text-green-600 dark:text-green-400 font-semibold">
                                    {Math.round(bestMonth.rate)}%
                                  </TableCell>
                                  <TableCell className="text-red-600 dark:text-red-400">
                                    {worstMonth.month}
                                  </TableCell>
                                  <TableCell className="text-right text-red-600 dark:text-red-400 font-semibold">
                                    {Math.round(worstMonth.rate)}%
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Math.round(variation)}pp
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        <p className="text-xs text-muted-foreground mt-2">
                          pp = puntos porcentuales de diferencia entre mejor y peor mes
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TableIcon className="h-5 w-5" />
                        Tabla de Evolución Temporal
                      </CardTitle>
                      <CardDescription>
                        Visitas mes a mes con detalle numérico
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[100px]">Mes</TableHead>
                              {compareType === 'gestores'
                                ? selectedGestoresForCompare.map((gestorId) => {
                                    const gestor = gestores.find(g => g.id === gestorId);
                                    return gestor ? (
                                      <>
                                        <TableHead key={`${gestorId}-v`} className="text-right min-w-[80px]">
                                          {gestor.name} (V)
                                        </TableHead>
                                        <TableHead key={`${gestorId}-e`} className="text-right min-w-[80px]">
                                          {gestor.name} (E)
                                        </TableHead>
                                      </>
                                    ) : null;
                                  })
                                : selectedOficinasForCompare.map((oficina) => (
                                    <>
                                      <TableHead key={`${oficina}-v`} className="text-right min-w-[80px]">
                                        {oficina} (V)
                                      </TableHead>
                                      <TableHead key={`${oficina}-e`} className="text-right min-w-[80px]">
                                        {oficina} (E)
                                      </TableHead>
                                    </>
                                  ))
                              }
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {temporalComparisonData.map((monthData) => (
                              <TableRow key={monthData.month}>
                                <TableCell className="font-medium">{monthData.monthLabel}</TableCell>
                                {compareType === 'gestores'
                                  ? selectedGestoresForCompare.map((gestorId) => {
                                      const gestor = gestores.find(g => g.id === gestorId);
                                      if (!gestor) return null;
                                      return (
                                        <>
                                          <TableCell key={`${gestorId}-v`} className="text-right">
                                            {monthData[`${gestor.name}_visitas`] || 0}
                                          </TableCell>
                                          <TableCell key={`${gestorId}-e`} className="text-right text-green-600 dark:text-green-400">
                                            {monthData[`${gestor.name}_exitosas`] || 0}
                                          </TableCell>
                                        </>
                                      );
                                    })
                                  : selectedOficinasForCompare.map((oficina) => (
                                      <>
                                        <TableCell key={`${oficina}-v`} className="text-right">
                                          {monthData[`${oficina}_visitas`] || 0}
                                        </TableCell>
                                        <TableCell key={`${oficina}-e`} className="text-right text-green-600 dark:text-green-400">
                                          {monthData[`${oficina}_exitosas`] || 0}
                                        </TableCell>
                                      </>
                                    ))
                                }
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <p className="text-xs text-muted-foreground mt-2">
                          (V) = Visitas totales, (E) = Visitas exitosas
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Evolución Temporal - Total de Visitas</CardTitle>
                      <CardDescription>Tendencia mes a mes de visitas realizadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={temporalComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monthLabel" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {compareType === 'gestores' 
                            ? selectedGestoresForCompare.map((gestorId, index) => {
                                const gestor = gestores.find(g => g.id === gestorId);
                                if (!gestor) return null;
                                const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
                                return (
                                  <Line
                                    key={gestorId}
                                    type="monotone"
                                    dataKey={`${gestor.name}_visitas`}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    name={`${gestor.name} - Visitas`}
                                    connectNulls
                                  />
                                );
                              })
                            : selectedOficinasForCompare.map((oficina, index) => {
                                const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
                                return (
                                  <Line
                                    key={oficina}
                                    type="monotone"
                                    dataKey={`${oficina}_visitas`}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    name={`${oficina} - Visitas`}
                                    connectNulls
                                  />
                                );
                              })
                          }
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Evolución Temporal - Visitas Exitosas</CardTitle>
                      <CardDescription>Tendencia mes a mes de visitas exitosas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={temporalComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monthLabel" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {compareType === 'gestores' 
                            ? selectedGestoresForCompare.map((gestorId, index) => {
                                const gestor = gestores.find(g => g.id === gestorId);
                                if (!gestor) return null;
                                const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
                                return (
                                  <Line
                                    key={gestorId}
                                    type="monotone"
                                    dataKey={`${gestor.name}_exitosas`}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    name={`${gestor.name} - Exitosas`}
                                    connectNulls
                                  />
                                );
                              })
                            : selectedOficinasForCompare.map((oficina, index) => {
                                const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
                                return (
                                  <Line
                                    key={oficina}
                                    type="monotone"
                                    dataKey={`${oficina}_exitosas`}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    name={`${oficina} - Exitosas`}
                                    connectNulls
                                  />
                                );
                              })
                          }
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Evolución de Tasa de Conversión</CardTitle>
                      <CardDescription>Porcentaje de éxito mes a mes (Exitosas / Total × 100)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart 
                          data={temporalComparisonData.map(monthData => {
                            const result: any = { 
                              monthLabel: monthData.monthLabel,
                              month: monthData.month 
                            };
                            
                            if (compareType === 'gestores') {
                              selectedGestoresForCompare.forEach(gestorId => {
                                const gestor = gestores.find(g => g.id === gestorId);
                                if (gestor) {
                                  const visitas = monthData[`${gestor.name}_visitas`] || 0;
                                  const exitosas = monthData[`${gestor.name}_exitosas`] || 0;
                                  result[`${gestor.name}_conversion`] = visitas > 0 
                                    ? Math.round((exitosas / visitas) * 100) 
                                    : 0;
                                }
                              });
                            } else {
                              selectedOficinasForCompare.forEach(oficina => {
                                const visitas = monthData[`${oficina}_visitas`] || 0;
                                const exitosas = monthData[`${oficina}_exitosas`] || 0;
                                result[`${oficina}_conversion`] = visitas > 0 
                                  ? Math.round((exitosas / visitas) * 100) 
                                  : 0;
                              });
                            }
                            
                            return result;
                          })}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monthLabel" />
                          <YAxis 
                            label={{ value: 'Tasa (%)', angle: -90, position: 'insideLeft' }}
                            domain={[0, 100]}
                          />
                          <Tooltip 
                            formatter={(value: any) => `${value}%`}
                          />
                          <Legend />
                          {compareType === 'gestores' 
                            ? selectedGestoresForCompare.map((gestorId, index) => {
                                const gestor = gestores.find(g => g.id === gestorId);
                                if (!gestor) return null;
                                const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
                                return (
                                  <Line
                                    key={gestorId}
                                    type="monotone"
                                    dataKey={`${gestor.name}_conversion`}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={3}
                                    name={`${gestor.name} - Tasa %`}
                                    connectNulls
                                    dot={{ r: 4 }}
                                  />
                                );
                              })
                            : selectedOficinasForCompare.map((oficina, index) => {
                                const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
                                return (
                                  <Line
                                    key={oficina}
                                    type="monotone"
                                    dataKey={`${oficina}_conversion`}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={3}
                                    name={`${oficina} - Tasa %`}
                                    connectNulls
                                    dot={{ r: 4 }}
                                  />
                                );
                              })
                          }
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
          {!comparisonLoading && comparisonData.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona {compareType === 'gestores' ? 'gestores' : 'oficinas'} para comparar sus métricas</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
