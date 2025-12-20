import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, TrendingUp, Bell, Warehouse, 
  Search, Filter, AlertTriangle, ArrowUpDown, ArrowUpRight, Sparkles
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

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

const categoryData = [
  { name: 'Café', value: 35, color: '#f59e0b' },
  { name: 'Lácteos', value: 25, color: '#3b82f6' },
  { name: 'Bollería', value: 20, color: '#10b981' },
  { name: 'Consumibles', value: 20, color: '#8b5cf6' },
];

const movementData = [
  { day: 'Lun', entrada: 45, salida: 32 },
  { day: 'Mar', entrada: 28, salida: 45 },
  { day: 'Mié', entrada: 52, salida: 38 },
  { day: 'Jue', entrada: 35, salida: 42 },
  { day: 'Vie', entrada: 60, salida: 55 },
];

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
    if (item.stock <= item.minStock) return { color: 'bg-red-500', text: 'Bajo', badge: 'bg-red-500/20 text-red-500 border-red-500/30' };
    if (percentage < 50) return { color: 'bg-amber-500', text: 'Medio', badge: 'bg-amber-500/20 text-amber-500 border-amber-500/30' };
    return { color: 'bg-emerald-500', text: 'Óptimo', badge: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Inventario</h2>
            <p className="text-muted-foreground">Control de stock en tiempo real</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Predicción IA
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
            <Package className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold">{demoInventory.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+3 este mes</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Inventario</p>
                <p className="text-2xl font-bold">{totalValue.toFixed(0)} €</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
                <span className="text-xs text-red-500">Requiere atención</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Almacenes</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Warehouse className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Movimientos de Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={movementData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="entrada" fill="#10b981" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="salida" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Salidas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Alertas de Stock</p>
                  <p className="text-sm text-muted-foreground">
                    {lowStockItems.length} productos por debajo del mínimo: {lowStockItems.map(i => i.name).join(', ')}
                  </p>
                </div>
                <Button className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700">
                  Generar Pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search and Filter */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showLowStock ? 'default' : 'outline'}
          onClick={() => setShowLowStock(!showLowStock)}
          className={showLowStock ? 'bg-red-500 hover:bg-red-600' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          Solo Stock Bajo
        </Button>
      </motion.div>

      {/* Inventory Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">
                      <Button variant="ghost" size="sm" className="gap-1 -ml-2">
                        Producto <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-left p-4 font-medium">SKU</th>
                    <th className="text-left p-4 font-medium">Stock</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-left p-4 font-medium">Almacén</th>
                    <th className="text-left p-4 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item, index) => {
                    const status = getStockStatus(item);
                    return (
                      <motion.tr 
                        key={item.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                              <Package className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-sm">{item.sku}</td>
                        <td className="p-4">
                          <div className="space-y-1 w-32">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.stock}</span>
                              <span className="text-xs text-muted-foreground">/ {item.maxStock}</span>
                            </div>
                            <Progress 
                              value={(item.stock / item.maxStock) * 100} 
                              className="h-1.5"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={status.badge}>{status.text}</Badge>
                        </td>
                        <td className="p-4 text-sm">{item.warehouse}</td>
                        <td className="p-4 font-medium text-emerald-500">
                          {(item.stock * item.price).toFixed(2)} €
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
