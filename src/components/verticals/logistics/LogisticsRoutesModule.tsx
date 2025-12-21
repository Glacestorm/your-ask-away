import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Route, Zap, AlertCircle, MapPin, Plus, Clock, Package,
  Search, Filter, TrendingUp, Navigation, ArrowRight,
  CheckCircle2, Timer, Truck, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';

interface RouteData {
  id: string;
  name: string;
  stops: number;
  completed: number;
  eta: string;
  distance: number;
  driver: string;
  vehicle: string;
  status: 'active' | 'completed' | 'pending' | 'delayed';
  optimized: boolean;
  fuelSaved?: number;
  timeSaved?: number;
}

const routes: RouteData[] = [
  { 
    id: 'R-001', 
    name: 'Zona Norte - Madrid', 
    stops: 12, 
    completed: 8, 
    eta: '14:30', 
    distance: 45, 
    driver: 'Carlos M.',
    vehicle: 'B-1234-ABC',
    status: 'active',
    optimized: true,
    fuelSaved: 12,
    timeSaved: 25
  },
  { 
    id: 'R-002', 
    name: 'Centro Ciudad', 
    stops: 15, 
    completed: 15, 
    eta: 'Completada', 
    distance: 32, 
    driver: 'Ana P.',
    vehicle: 'B-5678-DEF',
    status: 'completed',
    optimized: true,
    fuelSaved: 8,
    timeSaved: 18
  },
  { 
    id: 'R-003', 
    name: 'Polígono Industrial', 
    stops: 8, 
    completed: 2, 
    eta: '16:45', 
    distance: 28, 
    driver: 'Pedro L.',
    vehicle: 'B-9012-GHI',
    status: 'delayed',
    optimized: false
  },
  { 
    id: 'R-004', 
    name: 'Zona Sur', 
    stops: 10, 
    completed: 0, 
    eta: '18:00', 
    distance: 52, 
    driver: 'María R.',
    vehicle: 'B-3456-JKL',
    status: 'pending',
    optimized: true,
    fuelSaved: 15,
    timeSaved: 30
  },
  { 
    id: 'R-005', 
    name: 'Aeropuerto y alrededores', 
    stops: 6, 
    completed: 4, 
    eta: '15:15', 
    distance: 38, 
    driver: 'Luis F.',
    vehicle: 'B-7890-MNO',
    status: 'active',
    optimized: true,
    fuelSaved: 10,
    timeSaved: 20
  },
];

const optimizationData = [
  { month: 'Ene', sinOptimizar: 4500, optimizado: 3800 },
  { month: 'Feb', sinOptimizar: 4800, optimizado: 3900 },
  { month: 'Mar', sinOptimizar: 5200, optimizado: 4100 },
  { month: 'Abr', sinOptimizar: 4900, optimizado: 3850 },
  { month: 'May', sinOptimizar: 5100, optimizado: 4000 },
  { month: 'Jun', sinOptimizar: 5400, optimizado: 4200 },
];

const hourlyEfficiency = [
  { hour: '08:00', eficiencia: 85 },
  { hour: '09:00', eficiencia: 92 },
  { hour: '10:00', eficiencia: 88 },
  { hour: '11:00', eficiencia: 95 },
  { hour: '12:00', eficiencia: 78 },
  { hour: '13:00', eficiencia: 65 },
  { hour: '14:00', eficiencia: 82 },
  { hour: '15:00', eficiencia: 90 },
  { hour: '16:00', eficiencia: 87 },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Completada</Badge>;
    case 'active': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">En Curso</Badge>;
    case 'pending': return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Pendiente</Badge>;
    case 'delayed': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Retrasada</Badge>;
    default: return null;
  }
};

export const LogisticsRoutesModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('routes');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoutes = routes.filter(route => {
    const matchesFilter = filter === 'all' || route.status === filter;
    const matchesSearch = 
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Rutas Activas', value: routes.filter(r => r.status === 'active').length, icon: Navigation, color: 'text-blue-400' },
    { label: 'Completadas Hoy', value: routes.filter(r => r.status === 'completed').length, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Km Ahorrados', value: '156 km', icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Tiempo Ahorrado', value: '2.5h', icon: Timer, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Route className="w-8 h-8 text-emerald-400" />
            Planificación de Rutas
          </h1>
          <p className="text-slate-400 mt-1">Optimización inteligente con IA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
            <Zap className="h-4 w-4 mr-2 text-amber-400" />
            Optimizar IA
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Ruta
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

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Route, label: 'Planificador', color: 'text-blue-400', bg: 'bg-blue-500/20' },
          { icon: Zap, label: 'Optimización IA', color: 'text-amber-400', bg: 'bg-amber-500/20' },
          { icon: AlertCircle, label: 'Tráfico Real', color: 'text-red-400', bg: 'bg-red-500/20' },
          { icon: MapPin, label: 'Multi-parada', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${feature.bg}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <span className="font-medium text-sm text-white">{feature.label}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="routes">Rutas</TabsTrigger>
          <TabsTrigger value="optimization">Optimización</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-6">
          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar ruta..."
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
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">En Curso</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="delayed">Retrasadas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Routes List */}
          <div className="space-y-4">
            {filteredRoutes.map((route, index) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors ${
                  route.status === 'delayed' ? 'border-red-500/50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          route.status === 'completed' ? 'bg-emerald-500/20' :
                          route.status === 'active' ? 'bg-blue-500/20' :
                          route.status === 'delayed' ? 'bg-red-500/20' : 'bg-slate-500/20'
                        }`}>
                          <Route className={`w-6 h-6 ${
                            route.status === 'completed' ? 'text-emerald-400' :
                            route.status === 'active' ? 'text-blue-400' :
                            route.status === 'delayed' ? 'text-red-400' : 'text-slate-400'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono text-slate-500">{route.id}</span>
                            {getStatusBadge(route.status)}
                            {route.optimized && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                <Zap className="w-3 h-3 mr-1" />
                                Optimizada
                              </Badge>
                            )}
                          </div>
                          <p className="text-lg font-semibold text-white">{route.name}</p>
                          <p className="text-sm text-slate-400">{route.driver} • {route.vehicle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">ETA</p>
                        <p className="text-xl font-bold text-white">{route.eta}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-white">{route.stops} paradas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-white">{route.completed} completadas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-white">{route.distance} km</span>
                      </div>
                      {route.timeSaved && (
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm text-emerald-400">-{route.timeSaved} min</span>
                        </div>
                      )}
                    </div>

                    {route.status !== 'pending' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Progreso</span>
                          <span className="text-white">{Math.round((route.completed / route.stops) * 100)}%</span>
                        </div>
                        <Progress value={(route.completed / route.stops) * 100} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Ahorro por Optimización (Km)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={optimizationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
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
                    dataKey="sinOptimizar" 
                    stroke="#ef4444" 
                    fill="#ef444420" 
                    name="Sin Optimizar"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="optimizado" 
                    stroke="#10b981" 
                    fill="#10b98120"
                    name="Optimizado" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Eficiencia por Hora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[50, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="eficiencia" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    name="Eficiencia %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LogisticsRoutesModule;
