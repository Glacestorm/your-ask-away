import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Gauge,
  Activity,
  Package,
  Wrench,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// KPI Data
const kpis = [
  { 
    title: "OEE", 
    value: "87.3%", 
    change: "+2.4%", 
    trend: "up",
    icon: Gauge,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20"
  },
  { 
    title: "Producción Diaria", 
    value: "1,247", 
    change: "+156 uds", 
    trend: "up",
    icon: Package,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20"
  },
  { 
    title: "Eficiencia", 
    value: "94.2%", 
    change: "+1.8%", 
    trend: "up",
    icon: TrendingUp,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20"
  },
  { 
    title: "Paradas", 
    value: "2.1h", 
    change: "-0.5h", 
    trend: "down",
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20"
  }
];

// Production data for chart
const productionData = [
  { hour: '06:00', produccion: 45, objetivo: 50, defectos: 2 },
  { hour: '08:00', produccion: 52, objetivo: 50, defectos: 1 },
  { hour: '10:00', produccion: 48, objetivo: 50, defectos: 3 },
  { hour: '12:00', produccion: 55, objetivo: 50, defectos: 1 },
  { hour: '14:00', produccion: 51, objetivo: 50, defectos: 2 },
  { hour: '16:00', produccion: 47, objetivo: 50, defectos: 4 },
  { hour: '18:00', produccion: 53, objetivo: 50, defectos: 1 },
  { hour: '20:00', produccion: 49, objetivo: 50, defectos: 2 },
];

// Machine status
const machines = [
  { id: 'M-001', name: 'CNC Fresadora 1', status: 'running', efficiency: 92, product: 'Pieza A-234' },
  { id: 'M-002', name: 'CNC Fresadora 2', status: 'running', efficiency: 88, product: 'Pieza B-567' },
  { id: 'M-003', name: 'Torno CNC 1', status: 'maintenance', efficiency: 0, product: '-' },
  { id: 'M-004', name: 'Centro Mecanizado', status: 'running', efficiency: 95, product: 'Pieza C-890' },
  { id: 'M-005', name: 'Prensa Hidráulica', status: 'idle', efficiency: 0, product: '-' },
  { id: 'M-006', name: 'Robot Soldadura', status: 'running', efficiency: 91, product: 'Ensamble D-123' },
];

// OEE breakdown
const oeeData = [
  { name: 'Disponibilidad', value: 92, color: '#10b981' },
  { name: 'Rendimiento', value: 95, color: '#3b82f6' },
  { name: 'Calidad', value: 99.5, color: '#8b5cf6' },
];

// Maintenance alerts
const maintenanceAlerts = [
  { machine: 'CNC Fresadora 2', type: 'Preventivo', dueIn: '2 días', priority: 'medium' },
  { machine: 'Torno CNC 1', type: 'Correctivo', dueIn: 'En curso', priority: 'high' },
  { machine: 'Prensa Hidráulica', type: 'Preventivo', dueIn: '5 días', priority: 'low' },
];

// Active production orders
const activeOrders = [
  { id: 'OP-2024-001', product: 'Pieza A-234', quantity: 500, completed: 423, status: 'in_progress' },
  { id: 'OP-2024-002', product: 'Pieza B-567', quantity: 200, completed: 200, status: 'completed' },
  { id: 'OP-2024-003', product: 'Ensamble D-123', quantity: 100, completed: 45, status: 'in_progress' },
  { id: 'OP-2024-004', product: 'Pieza C-890', quantity: 300, completed: 0, status: 'planned' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-emerald-500';
    case 'idle': return 'bg-amber-500';
    case 'maintenance': return 'bg-red-500';
    default: return 'bg-slate-500';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'running': return 'En producción';
    case 'idle': return 'En espera';
    case 'maintenance': return 'Mantenimiento';
    default: return status;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

const getOrderStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Completada</Badge>;
    case 'in_progress': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">En Proceso</Badge>;
    case 'planned': return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Planificada</Badge>;
    default: return null;
  }
};

export const ManufacturingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Factory className="w-8 h-8 text-purple-400" />
            Dashboard de Producción
          </h1>
          <p className="text-slate-400 mt-1">Monitorización en tiempo real de la planta</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-2">
          <Activity className="w-4 h-4 mr-2 animate-pulse" />
          En vivo
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${kpi.bgColor}`}>
                    <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {kpi.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {kpi.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-400">{kpi.title}</p>
                  <p className="text-2xl font-bold text-white">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="machines">Máquinas</TabsTrigger>
          <TabsTrigger value="orders">Órdenes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Production Chart */}
            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Producción por Hora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={productionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="hour" stroke="#94a3b8" />
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
                      dataKey="objetivo" 
                      stroke="#64748b" 
                      fill="#64748b20" 
                      strokeDasharray="5 5"
                      name="Objetivo"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="produccion" 
                      stroke="#3b82f6" 
                      fill="#3b82f620"
                      name="Producción" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* OEE Breakdown */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-emerald-400" />
                  Desglose OEE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-8 border-emerald-500/30 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-white">87.3%</span>
                        <p className="text-xs text-slate-400">OEE Total</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {oeeData.map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">{item.name}</span>
                        <span className="text-white font-medium">{item.value}%</span>
                      </div>
                      <Progress value={item.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Alerts */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                Alertas de Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceAlerts.map((alert, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.priority === 'high' ? 'text-red-400' : 
                        alert.priority === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                      }`} />
                      <div>
                        <p className="text-white font-medium">{alert.machine}</p>
                        <p className="text-sm text-slate-400">{alert.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 text-sm">{alert.dueIn}</span>
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machines" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine, index) => (
              <motion.div
                key={machine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(machine.status)} animate-pulse`} />
                        <span className="text-xs text-slate-400">{machine.id}</span>
                      </div>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {getStatusLabel(machine.status)}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{machine.name}</h3>
                    {machine.status === 'running' && (
                      <>
                        <p className="text-sm text-slate-400 mb-3">Produciendo: {machine.product}</p>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Eficiencia</span>
                            <span className="text-emerald-400">{machine.efficiency}%</span>
                          </div>
                          <Progress value={machine.efficiency} className="h-2" />
                        </div>
                      </>
                    )}
                    {machine.status === 'maintenance' && (
                      <p className="text-sm text-amber-400">En mantenimiento correctivo</p>
                    )}
                    {machine.status === 'idle' && (
                      <p className="text-sm text-slate-500">Sin órdenes asignadas</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Órdenes de Producción Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium">{order.id}</span>
                        {getOrderStatusBadge(order.status)}
                      </div>
                      <span className="text-slate-400">{order.product}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress 
                          value={(order.completed / order.quantity) * 100} 
                          className="h-2" 
                        />
                      </div>
                      <span className="text-sm text-slate-400 whitespace-nowrap">
                        {order.completed} / {order.quantity} uds
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManufacturingDashboard;
