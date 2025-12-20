import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, TrendingUp, Euro, Users, 
  Package, Receipt, ArrowUp, ArrowDown, Calendar, BarChart3
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { RetailPOSModule } from './RetailPOSModule';
import { RetailInventoryModule } from './RetailInventoryModule';
import { RetailPurchasesModule } from './RetailPurchasesModule';
import { RetailFiscalModule } from './RetailFiscalModule';

const salesData = [
  { hour: '09:00', ventas: 245, clientes: 12 },
  { hour: '10:00', ventas: 420, clientes: 18 },
  { hour: '11:00', ventas: 580, clientes: 25 },
  { hour: '12:00', ventas: 890, clientes: 42 },
  { hour: '13:00', ventas: 1120, clientes: 55 },
  { hour: '14:00', ventas: 850, clientes: 38 },
  { hour: '15:00', ventas: 620, clientes: 28 },
];

const weeklyData = [
  { day: 'Lun', ventas: 2450, objetivo: 2200 },
  { day: 'Mar', ventas: 2680, objetivo: 2200 },
  { day: 'Mié', ventas: 2320, objetivo: 2200 },
  { day: 'Jue', ventas: 2890, objetivo: 2200 },
  { day: 'Vie', ventas: 3120, objetivo: 2200 },
  { day: 'Sáb', ventas: 3450, objetivo: 2800 },
  { day: 'Dom', ventas: 1850, objetivo: 1500 },
];

const categoryData = [
  { name: 'Bebidas', value: 35, color: '#f59e0b' },
  { name: 'Comida', value: 30, color: '#10b981' },
  { name: 'Snacks', value: 20, color: '#3b82f6' },
  { name: 'Otros', value: 15, color: '#8b5cf6' },
];

export const RetailDashboard: React.FC = () => {
  const [activeModule, setActiveModule] = useState('overview');

  const kpis = {
    salesToday: 2456.80,
    salesChange: 12.5,
    transactions: 47,
    avgTicket: 52.27,
    topProduct: 'Café con Leche',
    lowStockItems: 3,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'pos': return <RetailPOSModule />;
      case 'inventory': return <RetailInventoryModule />;
      case 'purchases': return <RetailPurchasesModule />;
      case 'fiscal': return <RetailFiscalModule />;
      default: return renderOverview();
    }
  };

  const renderOverview = () => (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas Hoy</p>
                <p className="text-3xl font-bold mt-1">{kpis.salesToday.toFixed(2)} €</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+{kpis.salesChange}%</span>
                  <span className="text-xs text-muted-foreground">vs ayer</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Euro className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transacciones</p>
                <p className="text-3xl font-bold mt-1">{kpis.transactions}</p>
                <p className="text-xs text-muted-foreground mt-2">Hoy</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Receipt className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Medio</p>
                <p className="text-3xl font-bold mt-1">{kpis.avgTicket.toFixed(2)} €</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+5.2%</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`overflow-hidden relative group ${kpis.lowStockItems > 0 ? 'border-destructive/50' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                <p className="text-3xl font-bold mt-1">{kpis.lowStockItems}</p>
                <p className="text-xs text-destructive mt-2">Productos en alerta</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                <Package className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-500" />
              Ventas por Hora (Hoy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} €`, 'Ventas']}
                />
                <Area type="monotone" dataKey="ventas" stroke="#f59e0b" fill="url(#salesGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-amber-500" />
              Por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
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
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              Ventas Semanales vs Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `${value.toLocaleString()} €`}
                />
                <Bar dataKey="ventas" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Ventas" />
                <Bar dataKey="objetivo" fill="#10b981" radius={[4, 4, 0, 0]} name="Objetivo" opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: ShoppingCart, label: 'Punto de Venta', module: 'pos', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
          { icon: Package, label: 'Inventario', module: 'inventory', color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25' },
          { icon: Users, label: 'Compras', module: 'purchases', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
          { icon: Receipt, label: 'Fiscal', module: 'fiscal', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              className="w-full h-24 flex-col gap-2 group hover:border-amber-500/50 transition-all"
              onClick={() => setActiveModule(action.module)}
            >
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadow}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity & Top Products */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-500" />
              Últimas Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: '14:32', items: 3, total: 12.50 },
                { time: '14:15', items: 1, total: 4.80 },
                { time: '13:58', items: 5, total: 28.00 },
                { time: '13:45', items: 2, total: 8.50 },
                { time: '13:30', items: 4, total: 15.20 },
              ].map((sale, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">{sale.time}</span>
                    <Badge variant="outline">{sale.items} items</Badge>
                  </div>
                  <span className="font-bold text-emerald-500">{sale.total.toFixed(2)} €</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Café con Leche', qty: 85, revenue: 153.00, trend: 'up' },
                { name: 'Tostada Tomate', qty: 42, revenue: 105.00, trend: 'up' },
                { name: 'Croissant', qty: 38, revenue: 72.20, trend: 'down' },
                { name: 'Zumo Naranja', qty: 31, revenue: 93.00, trend: 'up' },
                { name: 'Bocadillo Jamón', qty: 25, revenue: 112.50, trend: 'down' },
              ].map((product, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${product.trend === 'up' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {product.trend === 'up' ? (
                        <ArrowUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.qty} uds</p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-500">{product.revenue.toFixed(2)} €</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            Retail / Hostelería
          </h1>
          <p className="text-muted-foreground mt-1">Pack vertical completo para comercio minorista</p>
        </div>
        {activeModule !== 'overview' && (
          <Button variant="outline" onClick={() => setActiveModule('overview')}>
            ← Volver al Dashboard
          </Button>
        )}
      </div>

      {activeModule === 'overview' && (
        <Tabs defaultValue="dashboard" className="mb-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Informes</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {renderModule()}
    </div>
  );
};
