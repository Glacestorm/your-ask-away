import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  Package, 
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Filter,
  Download,
  RefreshCw,
  Search,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const mrpRequirements = [
  { 
    id: 'MAT-001', 
    material: 'Acero Inoxidable 304', 
    required: 500, 
    available: 320, 
    onOrder: 100, 
    deficit: 80,
    unit: 'kg',
    leadTime: 5,
    supplier: 'AcerosMex S.A.',
    status: 'critical'
  },
  { 
    id: 'MAT-002', 
    material: 'Aluminio 6061-T6', 
    required: 200, 
    available: 250, 
    onOrder: 0, 
    deficit: 0,
    unit: 'kg',
    leadTime: 3,
    supplier: 'MetalesPlus',
    status: 'ok'
  },
  { 
    id: 'MAT-003', 
    material: 'Tornillos M8x25', 
    required: 5000, 
    available: 3200, 
    onOrder: 2000, 
    deficit: 0,
    unit: 'uds',
    leadTime: 2,
    supplier: 'FixParts',
    status: 'pending'
  },
  { 
    id: 'MAT-004', 
    material: 'Motor Eléctrico 1.5kW', 
    required: 50, 
    available: 12, 
    onOrder: 30, 
    deficit: 8,
    unit: 'uds',
    leadTime: 15,
    supplier: 'ElectroMotores',
    status: 'warning'
  },
  { 
    id: 'MAT-005', 
    material: 'Rodamiento SKF 6205', 
    required: 200, 
    available: 180, 
    onOrder: 50, 
    deficit: 0,
    unit: 'uds',
    leadTime: 4,
    supplier: 'SKF España',
    status: 'ok'
  },
  { 
    id: 'MAT-006', 
    material: 'Cable Eléctrico 2.5mm²', 
    required: 1000, 
    available: 400, 
    onOrder: 0, 
    deficit: 600,
    unit: 'm',
    leadTime: 2,
    supplier: 'CablesInd',
    status: 'critical'
  },
];

const purchaseProposals = [
  { 
    id: 'PP-001', 
    material: 'Acero Inoxidable 304',
    quantity: 200,
    unit: 'kg',
    estimatedCost: 1200,
    supplier: 'AcerosMex S.A.',
    requiredDate: '2024-02-15',
    priority: 'high'
  },
  { 
    id: 'PP-002', 
    material: 'Cable Eléctrico 2.5mm²',
    quantity: 600,
    unit: 'm',
    estimatedCost: 420,
    supplier: 'CablesInd',
    requiredDate: '2024-02-12',
    priority: 'high'
  },
  { 
    id: 'PP-003', 
    material: 'Motor Eléctrico 1.5kW',
    quantity: 20,
    unit: 'uds',
    estimatedCost: 3400,
    supplier: 'ElectroMotores',
    requiredDate: '2024-02-20',
    priority: 'medium'
  },
];

const statusDistribution = [
  { name: 'OK', value: 2, color: '#10b981' },
  { name: 'Pendiente', value: 1, color: '#3b82f6' },
  { name: 'Advertencia', value: 1, color: '#f59e0b' },
  { name: 'Crítico', value: 2, color: '#ef4444' },
];

const demandForecast = [
  { week: 'S1', demanda: 450, disponible: 520 },
  { week: 'S2', demanda: 480, disponible: 490 },
  { week: 'S3', demanda: 520, disponible: 450 },
  { week: 'S4', demanda: 490, disponible: 420 },
  { week: 'S5', demanda: 550, disponible: 480 },
  { week: 'S6', demanda: 510, disponible: 540 },
];

const purchaseHistory = [
  { month: 'Oct', compras: 45000 },
  { month: 'Nov', compras: 52000 },
  { month: 'Dic', compras: 48000 },
  { month: 'Ene', compras: 61000 },
  { month: 'Feb', compras: 38000 },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'critical':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Crítico</Badge>;
    case 'warning':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Advertencia</Badge>;
    case 'pending':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pendiente</Badge>;
    case 'ok':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">OK</Badge>;
    default:
      return null;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Alta</Badge>;
    case 'medium':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Media</Badge>;
    case 'low':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Baja</Badge>;
    default:
      return null;
  }
};

export const ManufacturingMRPModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('requirements');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequirements = mrpRequirements.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Total Materiales', value: mrpRequirements.length, icon: Package, color: 'text-blue-400' },
    { label: 'Críticos', value: mrpRequirements.filter(m => m.status === 'critical').length, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Pendientes', value: mrpRequirements.filter(m => m.status === 'pending').length, icon: Clock, color: 'text-amber-400' },
    { label: 'OK', value: mrpRequirements.filter(m => m.status === 'ok').length, icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-400" />
            Planificación MRP
          </h1>
          <p className="text-slate-400 mt-1">Material Requirements Planning - Gestión de necesidades de materiales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalcular
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-700/50">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="requirements">Necesidades</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
          <TabsTrigger value="forecast">Previsión</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-6">
          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar material..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-900 border-slate-600 text-white"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px] bg-slate-900 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="critical">Críticos</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Requirements Table */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                Necesidades de Materiales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Código</TableHead>
                    <TableHead className="text-slate-400">Material</TableHead>
                    <TableHead className="text-slate-400 text-right">Requerido</TableHead>
                    <TableHead className="text-slate-400 text-right">Disponible</TableHead>
                    <TableHead className="text-slate-400 text-right">En Pedido</TableHead>
                    <TableHead className="text-slate-400 text-right">Déficit</TableHead>
                    <TableHead className="text-slate-400">Lead Time</TableHead>
                    <TableHead className="text-slate-400">Proveedor</TableHead>
                    <TableHead className="text-slate-400">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequirements.map((item) => (
                    <TableRow key={item.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell className="text-slate-300 font-mono">{item.id}</TableCell>
                      <TableCell className="text-white font-medium">{item.material}</TableCell>
                      <TableCell className="text-right text-slate-300">{item.required} {item.unit}</TableCell>
                      <TableCell className="text-right text-emerald-400">{item.available} {item.unit}</TableCell>
                      <TableCell className="text-right text-blue-400">{item.onOrder} {item.unit}</TableCell>
                      <TableCell className={`text-right font-medium ${item.deficit > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {item.deficit > 0 ? `-${item.deficit}` : '0'} {item.unit}
                      </TableCell>
                      <TableCell className="text-slate-400">{item.leadTime} días</TableCell>
                      <TableCell className="text-slate-300">{item.supplier}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-6">
          {/* Purchase Proposals */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                Propuestas de Compra Automáticas
              </CardTitle>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Generar Pedidos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchaseProposals.map((proposal, index) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{proposal.material}</p>
                        <p className="text-sm text-slate-400">
                          {proposal.quantity} {proposal.unit} • {proposal.supplier}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-white font-medium">€{proposal.estimatedCost.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">Entrega: {proposal.requiredDate}</p>
                      </div>
                      {getPriorityBadge(proposal.priority)}
                      <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                        Aprobar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Purchase History Chart */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Historial de Compras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={purchaseHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => `€${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `€${value.toLocaleString()}`}
                  />
                  <Bar dataKey="compras" fill="#3b82f6" name="Compras" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Previsión de Demanda vs Disponibilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={demandForecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="week" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="demanda" 
                    stroke="#ef4444" 
                    fill="#ef444420" 
                    name="Demanda Prevista"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="disponible" 
                    stroke="#10b981" 
                    fill="#10b98120"
                    name="Disponibilidad" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Critical Alert */}
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-white font-medium">Alerta: Déficit previsto en semanas 3-5</p>
                <p className="text-red-400">La demanda supera la disponibilidad proyectada. Se recomienda generar pedidos adicionales.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Distribución por Estado
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-8">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-white">{item.name}</span>
                      <span className="text-slate-400 font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Coverage Summary */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Cobertura de Inventario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mrpRequirements.slice(0, 4).map((item) => {
                  const coverage = Math.round(((item.available + item.onOrder) / item.required) * 100);
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm">{item.material}</span>
                        <span className={`text-sm font-medium ${coverage >= 100 ? 'text-emerald-400' : coverage >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                          {coverage}%
                        </span>
                      </div>
                      <Progress value={Math.min(coverage, 100)} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManufacturingMRPModule;
