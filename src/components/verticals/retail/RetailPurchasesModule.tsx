import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, ShoppingCart, PackageCheck, Scale, 
  Plus, FileText, Clock, CheckCircle, XCircle,
  Search, TrendingUp, Star, Phone, Mail,
  ArrowUpRight, ArrowDownRight, Truck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  products: number;
  rating: number;
  lastOrder: string;
  totalPurchases: number;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  items: number;
  total: number;
  status: 'pending' | 'sent' | 'received' | 'cancelled';
}

const purchasesByMonth = [
  { month: 'Jul', compras: 12500, pedidos: 18 },
  { month: 'Ago', compras: 14200, pedidos: 22 },
  { month: 'Sep', compras: 13800, pedidos: 20 },
  { month: 'Oct', compras: 15600, pedidos: 25 },
  { month: 'Nov', compras: 18200, pedidos: 28 },
  { month: 'Dic', compras: 22400, pedidos: 35 },
];

const supplierDistribution = [
  { name: 'Café Premium', value: 35, color: '#3b82f6' },
  { name: 'Lácteos Norte', value: 25, color: '#10b981' },
  { name: 'Dist. Martín', value: 20, color: '#f59e0b' },
  { name: 'Otros', value: 20, color: '#64748b' },
];

const deliveryPerformance = [
  { week: 'S1', atiempo: 92, retrasado: 8 },
  { week: 'S2', atiempo: 88, retrasado: 12 },
  { week: 'S3', atiempo: 95, retrasado: 5 },
  { week: 'S4', atiempo: 91, retrasado: 9 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const RetailPurchasesModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [searchTerm, setSearchTerm] = useState('');

  const suppliers: Supplier[] = [
    { id: '1', name: 'Café Premium S.L.', contact: 'Juan García', email: 'juan@cafepremium.es', phone: '+34 612 345 678', products: 15, rating: 4.8, lastOrder: '2024-01-10', totalPurchases: 45200 },
    { id: '2', name: 'Lácteos del Norte', contact: 'María López', email: 'maria@lacteosn.es', phone: '+34 623 456 789', products: 8, rating: 4.5, lastOrder: '2024-01-12', totalPurchases: 32100 },
    { id: '3', name: 'Distribuciones Martín', contact: 'Pedro Martín', email: 'pedro@dismarin.es', phone: '+34 634 567 890', products: 25, rating: 4.2, lastOrder: '2024-01-08', totalPurchases: 28500 },
  ];

  const orders: PurchaseOrder[] = [
    { id: 'PO-2024-001', supplier: 'Café Premium S.L.', date: '2024-01-15', items: 5, total: 450.00, status: 'pending' },
    { id: 'PO-2024-002', supplier: 'Lácteos del Norte', date: '2024-01-14', items: 3, total: 180.50, status: 'sent' },
    { id: 'PO-2024-003', supplier: 'Distribuciones Martín', date: '2024-01-12', items: 8, total: 320.00, status: 'received' },
    { id: 'PO-2024-004', supplier: 'Café Premium S.L.', date: '2024-01-10', items: 4, total: 380.00, status: 'received' },
    { id: 'PO-2024-005', supplier: 'Lácteos del Norte', date: '2024-01-08', items: 6, total: 520.00, status: 'received' },
  ];

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'sent': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1"><Truck className="h-3 w-3" /> Enviado</Badge>;
      case 'received': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1"><CheckCircle className="h-3 w-3" /> Recibido</Badge>;
      case 'cancelled': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><XCircle className="h-3 w-3" /> Cancelado</Badge>;
    }
  };

  const stats = [
    { label: 'Proveedores', value: suppliers.length, icon: Users, color: 'text-amber-400', bgColor: 'bg-amber-500/20', change: '+2' },
    { label: 'Pedidos Mes', value: orders.length, icon: ShoppingCart, color: 'text-blue-400', bgColor: 'bg-blue-500/20', change: '+12%' },
    { label: 'Pendientes', value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'text-purple-400', bgColor: 'bg-purple-500/20', change: '-3' },
    { label: 'Total Compras', value: `${orders.reduce((s, o) => s + o.total, 0).toFixed(0)}€`, icon: PackageCheck, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', change: '+18%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-400" />
            Gestión de Compras
          </h2>
          <p className="text-slate-400 mt-1">Proveedores, pedidos y análisis de compras</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Scale className="h-4 w-4 mr-2" />
            Comparar Precios
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-emerald-400">
                    <ArrowUpRight className="w-4 h-4" />
                    {stat.change}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Pedidos Recientes</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar pedidos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-slate-900 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/50">
                      <th className="text-left p-4 font-medium text-slate-400">Nº Pedido</th>
                      <th className="text-left p-4 font-medium text-slate-400">Proveedor</th>
                      <th className="text-left p-4 font-medium text-slate-400">Fecha</th>
                      <th className="text-left p-4 font-medium text-slate-400">Items</th>
                      <th className="text-left p-4 font-medium text-slate-400">Total</th>
                      <th className="text-left p-4 font-medium text-slate-400">Estado</th>
                      <th className="text-left p-4 font-medium text-slate-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <motion.tr 
                        key={order.id} 
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="p-4 font-mono text-sm text-white">{order.id}</td>
                        <td className="p-4 text-slate-300">{order.supplier}</td>
                        <td className="p-4 text-sm text-slate-400">{order.date}</td>
                        <td className="p-4 text-slate-300">{order.items}</td>
                        <td className="p-4 font-medium text-white">{order.total.toFixed(2)} €</td>
                        <td className="p-4">{getStatusBadge(order.status)}</td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {suppliers.map((supplier) => (
              <motion.div key={supplier.id} variants={itemVariants}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-white">{supplier.name}</CardTitle>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-medium">{supplier.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Users className="w-4 h-4" />
                        {supplier.contact}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="w-4 h-4" />
                        {supplier.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone className="w-4 h-4" />
                        {supplier.phone}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
                      <div>
                        <p className="text-lg font-bold text-white">{supplier.products}</p>
                        <p className="text-xs text-slate-500">Productos</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-emerald-400">{(supplier.totalPurchases / 1000).toFixed(1)}K €</p>
                        <p className="text-xs text-slate-500">Total Compras</p>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Hacer Pedido
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Evolución de Compras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={purchasesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="compras" 
                      stroke="#3b82f6" 
                      fill="#3b82f620" 
                      name="Compras (€)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Distribución por Proveedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={supplierDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {supplierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {supplierDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-400">{item.name}</span>
                      <span className="text-sm text-white font-medium ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-400" />
                Rendimiento de Entregas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={deliveryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="atiempo" stackId="a" fill="#10b981" name="A Tiempo %" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="retrasado" stackId="a" fill="#f59e0b" name="Retrasado %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RetailPurchasesModule;
