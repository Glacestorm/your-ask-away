import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Building2, User, Calendar as CalendarIcon, Download, Filter, CheckCircle, TrendingUp, Trophy, Medal, Building, Tag } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, parseISO } from 'date-fns';
import { es, ca } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ContractedProduct {
  id: string;
  company_id: string;
  product_id: string;
  contract_date: string;
  company_name: string;
  product_name: string;
  product_category: string;
  gestor_name: string;
  gestor_id: string;
  oficina: string;
  validated_by_name: string;
  validated_at: string;
  visit_sheet_id: string;
}

interface ProductStats {
  product_name: string;
  count: number;
}

interface GestorProductRanking {
  gestor_id: string;
  gestor_name: string;
  products_count: number;
  companies_count: number;
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  products: number;
  validations: number;
  approved: number;
  rejected: number;
}

interface OfficeComparison {
  oficina: string;
  products: number;
  validations: number;
  approved: number;
  rejected: number;
  approvalRate: number;
}

export default function ContractedProductsReport() {
  const { language } = useLanguage();
  const [products, setProducts] = useState<ContractedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(subMonths(new Date(), 5)));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));
  const [selectedGestor, setSelectedGestor] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedOficina, setSelectedOficina] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [gestores, setGestores] = useState<{ id: string; name: string }[]>([]);
  const [productList, setProductList] = useState<{ id: string; name: string; category: string }[]>([]);
  const [oficinas, setOficinas] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<ProductStats[]>([]);
  const [gestorRanking, setGestorRanking] = useState<GestorProductRanking[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [officeComparison, setOfficeComparison] = useState<OfficeComparison[]>([]);

  const dateLocale = language === 'ca' ? ca : es;

  useEffect(() => {
    fetchGestores();
    fetchProductList();
    fetchOficinas();
  }, []);

  useEffect(() => {
    fetchContractedProducts();
    fetchMonthlyEvolution();
    fetchOfficeComparison();
  }, [dateFrom, dateTo, selectedGestor, selectedProduct, selectedOficina, selectedCategory]);

  const fetchGestores = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name');
    if (data) {
      setGestores(data.map(g => ({ id: g.id, name: g.full_name || 'Sin nombre' })));
    }
  };

  const fetchProductList = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, category')
      .eq('active', true)
      .order('name');
    if (data) {
      setProductList(data.map(p => ({ id: p.id, name: p.name, category: p.category || 'Sin categoría' })));
      const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories as string[]);
    }
  };

  const fetchOficinas = async () => {
    const { data } = await supabase
      .from('companies')
      .select('oficina')
      .not('oficina', 'is', null);
    if (data) {
      const uniqueOficinas = [...new Set(data.map(c => c.oficina).filter(Boolean))];
      setOficinas(uniqueOficinas as string[]);
    }
  };

  const fetchMonthlyEvolution = async () => {
    const months = eachMonthOfInterval({ start: dateFrom, end: dateTo });
    const monthlyStats: MonthlyData[] = [];

    for (const month of months) {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      // Fetch products for this month
      let productsQuery = supabase
        .from('company_products')
        .select(`
          id, contract_date, product_id,
          company:companies(oficina, gestor_id),
          product:products(category)
        `)
        .gte('contract_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('contract_date', format(monthEnd, 'yyyy-MM-dd'))
        .eq('active', true);

      const { data: monthProducts } = await productsQuery;

      // Apply filters
      let filteredProducts = monthProducts || [];
      if (selectedOficina !== 'all') {
        filteredProducts = filteredProducts.filter(p => {
          const company = p.company as { oficina: string; gestor_id: string } | null;
          return company?.oficina === selectedOficina;
        });
      }
      if (selectedGestor !== 'all') {
        filteredProducts = filteredProducts.filter(p => {
          const company = p.company as { oficina: string; gestor_id: string } | null;
          return company?.gestor_id === selectedGestor;
        });
      }
      if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => {
          const product = p.product as { category: string } | null;
          return product?.category === selectedCategory;
        });
      }

      // Fetch validations for this month
      let validationsQuery = supabase
        .from('visit_sheets')
        .select('id, validation_status, validated_at, company:companies(oficina), gestor_id')
        .not('validation_status', 'is', null)
        .gte('validated_at', monthStart.toISOString())
        .lte('validated_at', monthEnd.toISOString());

      const { data: monthValidations } = await validationsQuery;

      let filteredValidations = monthValidations || [];
      if (selectedOficina !== 'all') {
        filteredValidations = filteredValidations.filter(v => {
          const company = v.company as { oficina: string } | null;
          return company?.oficina === selectedOficina;
        });
      }
      if (selectedGestor !== 'all') {
        filteredValidations = filteredValidations.filter(v => v.gestor_id === selectedGestor);
      }

      const approved = filteredValidations.filter(v => v.validation_status === 'approved').length;
      const rejected = filteredValidations.filter(v => v.validation_status === 'rejected').length;

      monthlyStats.push({
        month: format(month, 'yyyy-MM'),
        monthLabel: format(month, 'MMM yyyy', { locale: dateLocale }),
        products: filteredProducts.length,
        validations: filteredValidations.length,
        approved,
        rejected
      });
    }

    setMonthlyData(monthlyStats);
  };

  const fetchOfficeComparison = async () => {
    // Get all products with company office info
    const { data: allProducts } = await supabase
      .from('company_products')
      .select(`
        id, contract_date,
        company:companies(oficina)
      `)
      .gte('contract_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('contract_date', format(dateTo, 'yyyy-MM-dd'))
      .eq('active', true);

    // Get all validations with company office info
    const { data: allValidations } = await supabase
      .from('visit_sheets')
      .select(`
        id, validation_status,
        company:companies(oficina)
      `)
      .not('validation_status', 'is', null)
      .gte('validated_at', dateFrom.toISOString())
      .lte('validated_at', dateTo.toISOString());

    // Aggregate by office
    const officeData: Record<string, { products: number; validations: number; approved: number; rejected: number }> = {};

    for (const p of allProducts || []) {
      const company = p.company as unknown as { oficina: string } | null;
      const oficina = company?.oficina || 'Sin oficina';
      if (!officeData[oficina]) {
        officeData[oficina] = { products: 0, validations: 0, approved: 0, rejected: 0 };
      }
      officeData[oficina].products++;
    }

    for (const v of allValidations || []) {
      const company = v.company as unknown as { oficina: string } | null;
      const oficina = company?.oficina || 'Sin oficina';
      if (!officeData[oficina]) {
        officeData[oficina] = { products: 0, validations: 0, approved: 0, rejected: 0 };
      }
      officeData[oficina].validations++;
      if (v.validation_status === 'approved') {
        officeData[oficina].approved++;
      } else if (v.validation_status === 'rejected') {
        officeData[oficina].rejected++;
      }
    }

    const comparison: OfficeComparison[] = Object.entries(officeData)
      .map(([oficina, data]) => ({
        oficina,
        ...data,
        approvalRate: data.validations > 0 ? Math.round((data.approved / data.validations) * 100) : 0
      }))
      .sort((a, b) => b.products - a.products);

    setOfficeComparison(comparison);
  };

  const fetchContractedProducts = async () => {
    setLoading(true);
    
    let query = supabase
      .from('company_products')
      .select(`
        id, company_id, product_id, contract_date,
        company:companies(name, gestor_id, oficina),
        product:products(name, category)
      `)
      .gte('contract_date', format(dateFrom, 'yyyy-MM-dd'))
      .lte('contract_date', format(dateTo, 'yyyy-MM-dd'))
      .eq('active', true)
      .order('contract_date', { ascending: false });

    const { data: companyProducts, error } = await query;

    if (error) {
      console.error('Error fetching contracted products:', error);
      setLoading(false);
      return;
    }

    const { data: visitSheets } = await supabase
      .from('visit_sheets')
      .select(`
        id, company_id, gestor_id, validated_at, validated_by, productos_ofrecidos,
        gestor:profiles!visit_sheets_gestor_id_fkey(full_name),
        validator:profiles!visit_sheets_validated_by_fkey(full_name)
      `)
      .eq('validation_status', 'approved')
      .eq('resultado_oferta', 'aceptada')
      .gte('validated_at', dateFrom.toISOString())
      .lte('validated_at', dateTo.toISOString());

    const enrichedProducts: ContractedProduct[] = [];
    
    for (const cp of companyProducts || []) {
      const company = cp.company as { name: string; gestor_id: string; oficina: string } | null;
      const product = cp.product as { name: string; category: string } | null;
      
      if (!company || !product) continue;

      // Apply oficina filter
      if (selectedOficina !== 'all' && company.oficina !== selectedOficina) continue;
      
      // Apply category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) continue;

      const matchingSheet = visitSheets?.find(vs => 
        vs.company_id === cp.company_id && 
        Array.isArray(vs.productos_ofrecidos) &&
        (vs.productos_ofrecidos as string[]).includes(product.name)
      );

      let gestorName = 'Sin gestor';
      if (company.gestor_id) {
        const { data: gestorData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', company.gestor_id)
          .single();
        gestorName = gestorData?.full_name || 'Sin gestor';
      }

      if (selectedGestor !== 'all' && company.gestor_id !== selectedGestor) continue;
      if (selectedProduct !== 'all' && cp.product_id !== selectedProduct) continue;

      enrichedProducts.push({
        id: cp.id,
        company_id: cp.company_id,
        product_id: cp.product_id,
        contract_date: cp.contract_date || '',
        company_name: company.name,
        product_name: product.name,
        product_category: product.category || 'Sin categoría',
        gestor_name: gestorName,
        gestor_id: company.gestor_id || '',
        oficina: company.oficina || 'Sin oficina',
        validated_by_name: (matchingSheet?.validator as { full_name: string } | null)?.full_name || 'Sistema',
        validated_at: matchingSheet?.validated_at || cp.contract_date || '',
        visit_sheet_id: matchingSheet?.id || ''
      });
    }

    setProducts(enrichedProducts);

    const productCounts: Record<string, number> = {};
    enrichedProducts.forEach(p => {
      productCounts[p.product_name] = (productCounts[p.product_name] || 0) + 1;
    });
    
    const statsArray = Object.entries(productCounts)
      .map(([name, count]) => ({ product_name: name, count }))
      .sort((a, b) => b.count - a.count);
    
    setStats(statsArray);

    const gestorProductMap: Record<string, { products: number; companies: Set<string>; name: string }> = {};
    enrichedProducts.forEach(p => {
      if (!gestorProductMap[p.gestor_id]) {
        gestorProductMap[p.gestor_id] = { products: 0, companies: new Set(), name: p.gestor_name };
      }
      gestorProductMap[p.gestor_id].products += 1;
      gestorProductMap[p.gestor_id].companies.add(p.company_id);
    });
    
    const rankingArray: GestorProductRanking[] = Object.entries(gestorProductMap)
      .map(([gestor_id, data]) => ({
        gestor_id,
        gestor_name: data.name,
        products_count: data.products,
        companies_count: data.companies.size
      }))
      .sort((a, b) => b.products_count - a.products_count)
      .slice(0, 10);
    
    setGestorRanking(rankingArray);
    setLoading(false);
  };

  const exportToExcel = () => {
    const exportData = products.map(p => ({
      'Fecha Contratación': p.contract_date ? format(new Date(p.contract_date), 'dd/MM/yyyy') : '',
      'Empresa': p.company_name,
      'Oficina': p.oficina,
      'Producto': p.product_name,
      'Categoría': p.product_category,
      'Gestor': p.gestor_name,
      'Validado por': p.validated_by_name,
      'Fecha Validación': p.validated_at ? format(new Date(p.validated_at), 'dd/MM/yyyy HH:mm') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos Contratados');
    XLSX.writeFile(wb, `productos_contratados_${format(dateFrom, 'yyyy-MM-dd')}_${format(dateTo, 'yyyy-MM-dd')}.xlsx`);
  };

  const totalProducts = products.length;
  const uniqueCompanies = new Set(products.map(p => p.company_id)).size;
  const uniqueGestores = new Set(products.map(p => p.gestor_id)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Informe de Productos Contratados</h2>
        <Button onClick={exportToExcel} disabled={products.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Building2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresas</p>
                <p className="text-2xl font-bold">{uniqueCompanies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gestores</p>
                <p className="text-2xl font-bold">{uniqueGestores}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Producto Top</p>
                <p className="text-lg font-bold truncate">{stats[0]?.product_name || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros Avanzados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Desde:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(dateFrom, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    locale={dateLocale}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Hasta:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(dateTo, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && setDateTo(date)}
                    locale={dateLocale}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Select value={selectedOficina} onValueChange={setSelectedOficina}>
              <SelectTrigger>
                <Building className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Todas las oficinas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las oficinas</SelectItem>
                {oficinas.map(o => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <Tag className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGestor} onValueChange={setSelectedGestor}>
              <SelectTrigger>
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Todos los gestores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los gestores</SelectItem>
                {gestores.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <Package className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Todos los productos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {productList.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Evolution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolución Mensual de Productos Contratados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthLabel" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="products" fill="hsl(var(--primary))" name="Productos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Evolución Mensual de Validaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthLabel" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="approved" stroke="hsl(142, 76%, 36%)" strokeWidth={2} name="Aprobadas" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="rejected" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="Rechazadas" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="validations" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Office Comparison */}
      {officeComparison.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-500" />
                Productos Contratados por Oficina
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={officeComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="oficina" type="category" className="text-xs" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="products" fill="hsl(var(--primary))" name="Productos" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Ratio de Aprobación por Oficina
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={officeComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} unit="%" className="text-xs" />
                    <YAxis dataKey="oficina" type="category" className="text-xs" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Aprobación']}
                    />
                    <Bar dataKey="approvalRate" fill="hsl(142, 76%, 36%)" name="Aprobación %" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Office Stats Table */}
      {officeComparison.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Comparativa Detallada por Oficina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Oficina</TableHead>
                  <TableHead className="text-right">Productos</TableHead>
                  <TableHead className="text-right">Validaciones</TableHead>
                  <TableHead className="text-right">Aprobadas</TableHead>
                  <TableHead className="text-right">Rechazadas</TableHead>
                  <TableHead className="text-right">Ratio Aprobación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {officeComparison.map((o, index) => (
                  <TableRow key={o.oficina}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="w-4 h-4 text-amber-500" />}
                        {o.oficina}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">{o.products}</TableCell>
                    <TableCell className="text-right">{o.validations}</TableCell>
                    <TableCell className="text-right text-green-600">{o.approved}</TableCell>
                    <TableCell className="text-right text-red-500">{o.rejected}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={o.approvalRate >= 70 ? 'default' : o.approvalRate >= 50 ? 'secondary' : 'destructive'}>
                        {o.approvalRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Product Stats */}
      {stats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribución por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.slice(0, 10).map(s => (
                <Badge key={s.product_name} variant="secondary" className="text-sm py-1 px-3">
                  {s.product_name}: <span className="font-bold ml-1">{s.count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gestor Ranking */}
      {gestorRanking.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Ranking de Gestores por Productos Contratados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gestorRanking.map((g, index) => (
                <div 
                  key={g.gestor_id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {index < 3 ? <Medal className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{g.gestor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.companies_count} empresa{g.companies_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{g.products_count}</p>
                    <p className="text-xs text-muted-foreground">productos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalle de Productos Contratados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron productos contratados en el período seleccionado</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Oficina</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Validado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">
                        {p.contract_date ? format(new Date(p.contract_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{p.company_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.oficina}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          <Package className="w-3 h-3 mr-1" />
                          {p.product_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal text-xs">
                          {p.product_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.gestor_name}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          {p.validated_by_name}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}