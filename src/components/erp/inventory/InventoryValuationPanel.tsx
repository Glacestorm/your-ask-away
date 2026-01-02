/**
 * Panel de Valoración de Inventario
 * Muestra el valor del stock por diferentes métodos de coste
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calculator, 
  Download, 
  RefreshCw, 
  Loader2, 
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { useERPInventory, WarehouseStock } from '@/hooks/erp/useERPInventory';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ValuationSummary {
  totalValue: number;
  totalItems: number;
  totalQuantity: number;
  averageCost: number;
  byWarehouse: Array<{ name: string; value: number; quantity: number }>;
  topItems: Array<{ name: string; code: string; value: number; quantity: number; percentage: number }>;
  zeroStock: number;
  lowStock: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export function InventoryValuationPanel() {
  const { currentCompany } = useERPContext();
  const { fetchStock, fetchWarehouses, isLoading } = useERPInventory();
  
  const [stock, setStock] = useState<WarehouseStock[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [costMethod, setCostMethod] = useState<string>('avg');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      loadData();
    }
  }, [currentCompany]);

  const loadData = async () => {
    setLoading(true);
    const [stockData, warehouseData] = await Promise.all([
      fetchStock(),
      fetchWarehouses(),
    ]);
    setStock(stockData);
    setWarehouses(warehouseData);
    setLoading(false);
  };

  const filteredStock = useMemo(() => {
    if (selectedWarehouse === 'all') return stock;
    return stock.filter(s => s.warehouse_id === selectedWarehouse);
  }, [stock, selectedWarehouse]);

  const valuation: ValuationSummary = useMemo(() => {
    const items = filteredStock.filter(s => s.quantity > 0);
    
    const totalValue = items.reduce((sum, s) => sum + (s.quantity * s.avg_cost), 0);
    const totalQuantity = items.reduce((sum, s) => sum + s.quantity, 0);
    
    // Por almacén
    const warehouseMap = new Map<string, { name: string; value: number; quantity: number }>();
    items.forEach(s => {
      const key = s.warehouse_id;
      const existing = warehouseMap.get(key) || { name: s.warehouse_name || 'Sin almacén', value: 0, quantity: 0 };
      existing.value += s.quantity * s.avg_cost;
      existing.quantity += s.quantity;
      warehouseMap.set(key, existing);
    });
    
    // Top items por valor
    const topItems = items
      .map(s => ({
        name: s.item_name || '',
        code: s.item_code || '',
        value: s.quantity * s.avg_cost,
        quantity: s.quantity,
        percentage: totalValue > 0 ? (s.quantity * s.avg_cost / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    return {
      totalValue,
      totalItems: items.length,
      totalQuantity,
      averageCost: totalQuantity > 0 ? totalValue / totalQuantity : 0,
      byWarehouse: Array.from(warehouseMap.values()),
      topItems,
      zeroStock: stock.filter(s => s.quantity === 0).length,
      lowStock: stock.filter(s => s.quantity > 0 && s.quantity < 10).length,
    };
  }, [filteredStock, stock]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  if (!currentCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Selecciona una empresa para ver la valoración
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Valoración de Inventario</h3>
            <p className="text-sm text-muted-foreground">Valor del stock por método de coste</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Almacén" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los almacenes</SelectItem>
              {warehouses.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={costMethod} onValueChange={setCostMethod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="avg">Coste Medio</SelectItem>
              <SelectItem value="fifo">FIFO</SelectItem>
              <SelectItem value="lifo">LIFO</SelectItem>
              <SelectItem value="standard">Estándar</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {loading || isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(valuation.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary/30" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Artículos con Stock</p>
                  <p className="text-2xl font-bold">{valuation.totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500/30" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Unidades Totales</p>
                  <p className="text-2xl font-bold">{formatNumber(valuation.totalQuantity)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500/30" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Coste Medio</p>
                  <p className="text-2xl font-bold">{formatCurrency(valuation.averageCost)}</p>
                </div>
                <Calculator className="h-8 w-8 text-orange-500/30" />
              </div>
            </Card>
          </div>

          {/* Alertas */}
          {(valuation.zeroStock > 0 || valuation.lowStock > 0) && (
            <div className="flex gap-4">
              {valuation.zeroStock > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">{valuation.zeroStock} artículos sin stock</span>
                </div>
              )}
              {valuation.lowStock > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <TrendingDown className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">{valuation.lowStock} artículos con stock bajo</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Distribución por Almacén */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Valor por Almacén</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={valuation.byWarehouse}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {valuation.byWarehouse.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top 10 Artículos por Valor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top 10 por Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={valuation.topItems.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="code" width={80} className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" name="Valor" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla detallada */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detalle de Valoración</CardTitle>
              <CardDescription>Desglose por artículo y almacén</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Artículo</TableHead>
                      <TableHead>Almacén</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Coste Medio</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">% Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStock
                      .filter(s => s.quantity > 0)
                      .sort((a, b) => (b.quantity * b.avg_cost) - (a.quantity * a.avg_cost))
                      .map((item) => {
                        const value = item.quantity * item.avg_cost;
                        const percentage = valuation.totalValue > 0 ? (value / valuation.totalValue) * 100 : 0;
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">{item.item_code}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{item.item_name}</TableCell>
                            <TableCell>{item.warehouse_name}</TableCell>
                            <TableCell className="text-right font-mono">{formatNumber(item.quantity)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(item.avg_cost)}</TableCell>
                            <TableCell className="text-right font-mono font-medium">{formatCurrency(value)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Progress value={percentage} className="w-16 h-2" />
                                <span className="text-xs text-muted-foreground w-12 text-right">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default InventoryValuationPanel;
