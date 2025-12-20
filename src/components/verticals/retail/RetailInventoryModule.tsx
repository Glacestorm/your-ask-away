import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, TrendingUp, Bell, Warehouse, 
  Search, Filter, AlertTriangle, ArrowUpDown
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  maxStock: number;
  price: number;
  category: string;
  warehouse: string;
  lastMovement: string;
}

export const RetailInventoryModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const demoInventory: InventoryItem[] = [
    { id: '1', name: 'Café Molido 1kg', sku: 'CAF001', stock: 45, minStock: 20, maxStock: 100, price: 12.50, category: 'Café', warehouse: 'Principal', lastMovement: '2024-01-15' },
    { id: '2', name: 'Leche Entera 1L', sku: 'LEC001', stock: 120, minStock: 50, maxStock: 200, price: 1.20, category: 'Lácteos', warehouse: 'Principal', lastMovement: '2024-01-15' },
    { id: '3', name: 'Azúcar Blanca 1kg', sku: 'AZU001', stock: 15, minStock: 25, maxStock: 80, price: 1.50, category: 'Básicos', warehouse: 'Principal', lastMovement: '2024-01-14' },
    { id: '4', name: 'Croissants (12 uds)', sku: 'CRO001', stock: 8, minStock: 10, maxStock: 30, price: 6.00, category: 'Bollería', warehouse: 'Principal', lastMovement: '2024-01-15' },
    { id: '5', name: 'Servilletas (500 uds)', sku: 'SER001', stock: 200, minStock: 100, maxStock: 500, price: 4.50, category: 'Consumibles', warehouse: 'Almacén B', lastMovement: '2024-01-10' },
    { id: '6', name: 'Vasos Café (100 uds)', sku: 'VAS001', stock: 350, minStock: 200, maxStock: 1000, price: 8.00, category: 'Consumibles', warehouse: 'Almacén B', lastMovement: '2024-01-12' },
  ];

  const lowStockItems = demoInventory.filter(item => item.stock <= item.minStock);
  const totalValue = demoInventory.reduce((sum, item) => sum + item.stock * item.price, 0);
  
  const filteredInventory = demoInventory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLowStock = showLowStock ? item.stock <= item.minStock : true;
      return matchesSearch && matchesLowStock;
    });

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.stock / item.maxStock) * 100;
    if (item.stock <= item.minStock) return { color: 'bg-destructive', text: 'Bajo', badge: 'destructive' };
    if (percentage < 50) return { color: 'bg-amber-500', text: 'Medio', badge: 'warning' };
    return { color: 'bg-emerald-500', text: 'Óptimo', badge: 'default' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventario</h2>
          <p className="text-muted-foreground">Control de stock en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Predicción IA
          </Button>
          <Button size="sm">
            <Package className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold">{demoInventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Inventario</p>
                <p className="text-2xl font-bold">{totalValue.toFixed(0)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Warehouse className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Almacenes</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Alertas de Stock</p>
                <p className="text-sm text-muted-foreground">
                  {lowStockItems.length} productos por debajo del mínimo: {lowStockItems.map(i => i.name).join(', ')}
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                Generar Pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Button
              variant={showLowStock ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowLowStock(!showLowStock)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Solo Stock Bajo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">
                    <Button variant="ghost" size="sm" className="gap-1 -ml-2">
                      Producto <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </th>
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-left p-3 font-medium">Stock</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                  <th className="text-left p-3 font-medium">Almacén</th>
                  <th className="text-left p-3 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-sm">{item.sku}</td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.stock}</span>
                            <span className="text-xs text-muted-foreground">
                              / {item.maxStock}
                            </span>
                          </div>
                          <Progress 
                            value={(item.stock / item.maxStock) * 100} 
                            className="h-1.5"
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={status.badge as any}>{status.text}</Badge>
                      </td>
                      <td className="p-3 text-sm">{item.warehouse}</td>
                      <td className="p-3 font-medium">
                        {(item.stock * item.price).toFixed(2)} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
