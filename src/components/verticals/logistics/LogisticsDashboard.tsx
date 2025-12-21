import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, Route, FileCheck, Grid, MapPin, 
  Clock, Package, AlertTriangle, CheckCircle,
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Activity, Fuel, Timer, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Cell,
  LineChart,
  Line
} from 'recharts';

// KPI Data
const kpis = [
  { 
    title: "Vehículos Activos", 
    value: "12", 
    change: "+2", 
    trend: "up",
    icon: Truck,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20"
  },
  { 
    title: "Entregas Hoy", 
    value: "156", 
    change: "+23", 
    trend: "up",
    icon: Package,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20"
  },
  { 
    title: "Puntualidad", 
    value: "94.2%", 
    change: "+1.8%", 
    trend: "up",
    icon: Timer,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20"
  },
  { 
    title: "Km Recorridos", 
    value: "2,847", 
    change: "-156", 
    trend: "down",
    icon: Route,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20"
  }
];

// Delivery performance by hour
const hourlyDeliveries = [
  { hour: '08:00', entregas: 12, objetivo: 15 },
  { hour: '09:00', entregas: 18, objetivo: 15 },
  { hour: '10:00', entregas: 22, objetivo: 20 },
  { hour: '11:00', entregas: 25, objetivo: 20 },
  { hour: '12:00', entregas: 15, objetivo: 15 },
  { hour: '13:00', entregas: 8, objetivo: 10 },
  { hour: '14:00', entregas: 14, objetivo: 15 },
  { hour: '15:00', entregas: 20, objetivo: 18 },
  { hour: '16:00', entregas: 22, objetivo: 20 },
];

// Fleet status distribution
const fleetStatus = [
  { name: 'En Ruta', value: 8, color: '#10b981' },
  { name: 'Cargando', value: 2, color: '#3b82f6' },
  { name: 'Mantenimiento', value: 1, color: '#f59e0b' },
  { name: 'Disponible', value: 3, color: '#6b7280' },
];

// Weekly performance
const weeklyPerformance = [
  { day: 'Lun', entregas: 145, puntualidad: 92 },
  { day: 'Mar', entregas: 162, puntualidad: 95 },
  { day: 'Mié', entregas: 138, puntualidad: 89 },
  { day: 'Jue', entregas: 171, puntualidad: 96 },
  { day: 'Vie', entregas: 156, puntualidad: 94 },
];

const deliveries = [
  { id: 'DEL-001', driver: 'Carlos M.', vehicle: 'B-1234-ABC', stops: 12, completed: 8, status: 'in_route', eta: '14:30' },
  { id: 'DEL-002', driver: 'Ana P.', vehicle: 'B-5678-DEF', stops: 15, completed: 15, status: 'completed', eta: 'Finalizado' },
  { id: 'DEL-003', driver: 'Pedro L.', vehicle: 'B-9012-GHI', stops: 10, completed: 3, status: 'in_route', eta: '16:45' },
  { id: 'DEL-004', driver: 'María R.', vehicle: 'B-3456-JKL', stops: 8, completed: 0, status: 'pending', eta: '17:00' },
  { id: 'DEL-005', driver: 'Luis F.', vehicle: 'B-7890-MNO', stops: 14, completed: 10, status: 'in_route', eta: '15:15' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Completada</Badge>;
    case 'in_route': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">En Ruta</Badge>;
    case 'pending': return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Pendiente</Badge>;
    default: return null;
  }
};

export const LogisticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const totalStops = deliveries.reduce((s, d) => s + d.stops, 0);
  const completedStops = deliveries.reduce((s, d) => s + d.completed, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-400" />
            Dashboard Logística
          </h1>
          <p className="text-slate-400 mt-1">Gestión de flotas y entregas en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-2">
            <Activity className="w-4 h-4 mr-2 animate-pulse" />
            En vivo
          </Badge>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Route className="h-4 w-4 mr-2" />
            Nueva Ruta
          </Button>
        </div>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Truck, label: 'Flotas', color: 'text-blue-400', bg: 'bg-blue-500/20' },
          { icon: Route, label: 'Rutas', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
          { icon: FileCheck, label: 'SLAs', color: 'text-amber-400', bg: 'bg-amber-500/20' },
          { icon: Grid, label: 'Almacén', color: 'text-violet-400', bg: 'bg-violet-500/20' },
          { icon: MapPin, label: 'Última Milla', color: 'text-red-400', bg: 'bg-red-500/20' },
        ].map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Button variant="outline" className="w-full h-20 flex-col gap-2 bg-slate-800/50 border-slate-700 hover:border-slate-600 text-white hover:text-white hover:bg-slate-700/50">
              <div className={`p-2 rounded-lg ${action.bg}`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <span className="text-xs">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="deliveries">Entregas</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Hourly Deliveries Chart */}
            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  Entregas por Hora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={hourlyDeliveries}>
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
                      dataKey="entregas" 
                      stroke="#10b981" 
                      fill="#10b98120"
                      name="Entregas" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fleet Status */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-400" />
                  Estado de Flota
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={fleetStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {fleetStatus.map((entry, index) => (
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
                <div className="space-y-2 mt-4">
                  {fleetStatus.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-400">{item.name}</span>
                      </div>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Progreso del Día
                </div>
                <span className="text-emerald-400 text-2xl font-bold">
                  {Math.round((completedStops / totalStops) * 100)}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(completedStops / totalStops) * 100} className="h-4" />
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-400">{completedStops} entregas completadas</span>
                <span className="text-slate-400">{totalStops - completedStops} pendientes</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-6">
          <div className="space-y-4">
            {deliveries.map((delivery, index) => (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          delivery.status === 'completed' ? 'bg-emerald-500/20' :
                          delivery.status === 'in_route' ? 'bg-blue-500/20' : 'bg-slate-500/20'
                        }`}>
                          <Truck className={`w-6 h-6 ${
                            delivery.status === 'completed' ? 'text-emerald-400' :
                            delivery.status === 'in_route' ? 'text-blue-400' : 'text-slate-400'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono text-slate-500">{delivery.id}</span>
                            {getStatusBadge(delivery.status)}
                          </div>
                          <p className="text-lg font-semibold text-white">{delivery.driver}</p>
                          <p className="text-sm text-slate-400">{delivery.vehicle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">ETA</p>
                        <p className="text-lg font-semibold text-white">{delivery.eta}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Entregas: {delivery.completed} / {delivery.stops}</span>
                        <span className="text-white">{Math.round((delivery.completed / delivery.stops) * 100)}%</span>
                      </div>
                      <Progress value={(delivery.completed / delivery.stops) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Rendimiento Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={weeklyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis yAxisId="left" stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" domain={[80, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar yAxisId="left" dataKey="entregas" fill="#3b82f6" name="Entregas" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="puntualidad" stroke="#10b981" strokeWidth={3} name="Puntualidad %" dot={{ fill: '#10b981', strokeWidth: 2 }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LogisticsDashboard;
