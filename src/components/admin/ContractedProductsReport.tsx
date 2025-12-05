import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Building2, User, Calendar as CalendarIcon, Download, Filter, CheckCircle, TrendingUp, Trophy, Medal } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es, ca } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface ContractedProduct {
  id: string;
  company_id: string;
  product_id: string;
  contract_date: string;
  company_name: string;
  product_name: string;
  gestor_name: string;
  gestor_id: string;
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

export default function ContractedProductsReport() {
  const { language } = useLanguage();
  const [products, setProducts] = useState<ContractedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));
  const [selectedGestor, setSelectedGestor] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [gestores, setGestores] = useState<{ id: string; name: string }[]>([]);
  const [productList, setProductList] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<ProductStats[]>([]);
  const [gestorRanking, setGestorRanking] = useState<GestorProductRanking[]>([]);

  const dateLocale = language === 'ca' ? ca : es;

  useEffect(() => {
    fetchGestores();
    fetchProductList();
  }, []);

  useEffect(() => {
    fetchContractedProducts();
  }, [dateFrom, dateTo, selectedGestor, selectedProduct]);

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
      .select('id, name')
      .eq('active', true)
      .order('name');
    if (data) {
      setProductList(data);
    }
  };

  const fetchContractedProducts = async () => {
    setLoading(true);
    
    // Get company_products added via validation (contract_date within range)
    let query = supabase
      .from('company_products')
      .select(`
        id, company_id, product_id, contract_date,
        company:companies(name, gestor_id),
        product:products(name)
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

    // Get visit sheets with validation info for these dates
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

    // Map company_products to visit sheets for validation info
    const enrichedProducts: ContractedProduct[] = [];
    
    for (const cp of companyProducts || []) {
      const company = cp.company as { name: string; gestor_id: string } | null;
      const product = cp.product as { name: string } | null;
      
      if (!company || !product) continue;

      // Find matching visit sheet
      const matchingSheet = visitSheets?.find(vs => 
        vs.company_id === cp.company_id && 
        Array.isArray(vs.productos_ofrecidos) &&
        (vs.productos_ofrecidos as string[]).includes(product.name)
      );

      // Get gestor info
      let gestorName = 'Sin gestor';
      if (company.gestor_id) {
        const { data: gestorData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', company.gestor_id)
          .single();
        gestorName = gestorData?.full_name || 'Sin gestor';
      }

      // Filter by gestor if selected
      if (selectedGestor !== 'all' && company.gestor_id !== selectedGestor) continue;
      
      // Filter by product if selected
      if (selectedProduct !== 'all' && cp.product_id !== selectedProduct) continue;

      enrichedProducts.push({
        id: cp.id,
        company_id: cp.company_id,
        product_id: cp.product_id,
        contract_date: cp.contract_date || '',
        company_name: company.name,
        product_name: product.name,
        gestor_name: gestorName,
        gestor_id: company.gestor_id || '',
        validated_by_name: (matchingSheet?.validator as { full_name: string } | null)?.full_name || 'Sistema',
        validated_at: matchingSheet?.validated_at || cp.contract_date || '',
        visit_sheet_id: matchingSheet?.id || ''
      });
    }

    setProducts(enrichedProducts);

    // Calculate stats
    const productCounts: Record<string, number> = {};
    enrichedProducts.forEach(p => {
      productCounts[p.product_name] = (productCounts[p.product_name] || 0) + 1;
    });
    
    const statsArray = Object.entries(productCounts)
      .map(([name, count]) => ({ product_name: name, count }))
      .sort((a, b) => b.count - a.count);
    
    setStats(statsArray);

    // Calculate gestor ranking
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
      'Producto': p.product_name,
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

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Desde:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[140px]">
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
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Hasta:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[140px]">
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
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Select value={selectedGestor} onValueChange={setSelectedGestor}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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
                    <TableHead>Producto</TableHead>
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
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          <Package className="w-3 h-3 mr-1" />
                          {p.product_name}
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
