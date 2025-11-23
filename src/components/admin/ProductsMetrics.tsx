import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function ProductsMetrics() {
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [productsOffered, setProductsOffered] = useState<any[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<any[]>([]);

  useEffect(() => {
    fetchProductsData();
  }, []);

  const fetchProductsData = async () => {
    try {
      setLoading(true);

      // Productos más contratados
      const { data: companyProducts } = await supabase
        .from('company_products')
        .select('product_id, products(name, category)')
        .eq('active', true);

      const productMap: any = {};
      companyProducts?.forEach((cp: any) => {
        const name = cp.products?.name || 'Desconocido';
        if (!productMap[name]) {
          productMap[name] = { producto: name, contratos: 0 };
        }
        productMap[name].contratos++;
      });

      const sorted = Object.values(productMap)
        .sort((a: any, b: any) => (b.contratos || 0) - (a.contratos || 0))
        .slice(0, 10)
        .filter((p: any) => p.producto && !isNaN(p.contratos));
      setTopProducts(sorted);

      // Productos más ofrecidos en visitas
      const { data: visits } = await supabase
        .from('visits')
        .select('productos_ofrecidos')
        .not('productos_ofrecidos', 'is', null);

      const offeredMap: any = {};
      visits?.forEach((visit: any) => {
        visit.productos_ofrecidos?.forEach((prod: string) => {
          if (!offeredMap[prod]) {
            offeredMap[prod] = { producto: prod, ofertas: 0 };
          }
          offeredMap[prod].ofertas++;
        });
      });

      const sortedOffered = Object.values(offeredMap)
        .sort((a: any, b: any) => (b.ofertas || 0) - (a.ofertas || 0))
        .slice(0, 10)
        .filter((p: any) => p.producto && !isNaN(p.ofertas));
      setProductsOffered(sortedOffered);

      // Distribución por categoría
      const { data: products } = await supabase
        .from('products')
        .select('category')
        .eq('active', true);

      const categoryMap: any = {};
      products?.forEach((p: any) => {
        const cat = p.category || 'Sin categoría';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { name: cat, value: 0 };
        }
        categoryMap[cat].value++;
      });

      setProductsByCategory(Object.values(categoryMap));

    } catch (error: any) {
      console.error('Error fetching products data:', error);
      toast.error('Error al cargar datos de productos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos Activos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsByCategory.reduce((sum, c) => sum + c.value, 0)}</div>
            <p className="text-xs text-muted-foreground">En catálogo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Producto Más Contratado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {topProducts.length > 0 ? topProducts[0].producto : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topProducts.length > 0 ? `${topProducts[0].contratos} contratos` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Más Ofrecido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {productsOffered.length > 0 ? productsOffered[0].producto : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {productsOffered.length > 0 ? `${productsOffered[0].ofertas} veces` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 10 Productos Contratados */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Productos Contratados</CardTitle>
            <CardDescription>Productos con más contratos activos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="producto" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="contratos" fill="hsl(var(--primary))" name="Contratos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 Productos Ofrecidos */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Productos Ofrecidos</CardTitle>
            <CardDescription>Productos más ofrecidos en visitas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={productsOffered} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="producto" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="ofertas" fill="hsl(var(--chart-2))" name="Ofertas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Categoría */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Distribución por Categoría</CardTitle>
            <CardDescription>Productos activos por tipo</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {productsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
