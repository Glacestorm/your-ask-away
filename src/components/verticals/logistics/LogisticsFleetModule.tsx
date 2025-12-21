import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, User, Wrench, FileText, Plus, MapPin,
  Fuel, Timer, AlertTriangle, CheckCircle, Search,
  Filter, Calendar, Activity, Settings, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Vehicle {
  id: string;
  plate: string;
  type: string;
  brand: string;
  model: string;
  driver: string;
  status: 'active' | 'maintenance' | 'inactive';
  km: number;
  fuel: number;
  nextService: string;
  location: string;
  efficiency: number;
}

const vehicles: Vehicle[] = [
  { 
    id: '1', 
    plate: 'B-1234-ABC', 
    type: 'Furgoneta', 
    brand: 'Mercedes',
    model: 'Sprinter 314',
    driver: 'Carlos Martínez', 
    status: 'active', 
    km: 45230, 
    fuel: 72,
    nextService: '2024-02-15',
    location: 'Zona Norte - Madrid',
    efficiency: 94
  },
  { 
    id: '2', 
    plate: 'B-5678-DEF', 
    type: 'Camión 3.5T', 
    brand: 'Iveco',
    model: 'Daily 35-160',
    driver: 'Ana Pérez', 
    status: 'active', 
    km: 128450, 
    fuel: 45,
    nextService: '2024-01-25',
    location: 'Polígono Industrial',
    efficiency: 88
  },
  { 
    id: '3', 
    plate: 'B-9012-GHI', 
    type: 'Furgoneta', 
    brand: 'Ford',
    model: 'Transit Custom',
    driver: 'Pedro López', 
    status: 'maintenance', 
    km: 87600, 
    fuel: 0,
    nextService: 'En taller',
    location: 'Taller Central',
    efficiency: 0
  },
  { 
    id: '4', 
    plate: 'B-3456-JKL', 
    type: 'Camión 3.5T', 
    brand: 'MAN',
    model: 'TGE 3.140',
    driver: 'María Ruiz', 
    status: 'active', 
    km: 56800, 
    fuel: 85,
    nextService: '2024-03-10',
    location: 'Centro Ciudad',
    efficiency: 96
  },
  { 
    id: '5', 
    plate: 'B-7890-MNO', 
    type: 'Furgoneta', 
    brand: 'Renault',
    model: 'Master',
    driver: 'Luis Fernández', 
    status: 'inactive', 
    km: 112300, 
    fuel: 30,
    nextService: '2024-01-20',
    location: 'Base Central',
    efficiency: 0
  },
];

const kmByVehicle = [
  { name: 'B-1234-ABC', km: 1250 },
  { name: 'B-5678-DEF', km: 1890 },
  { name: 'B-3456-JKL', km: 1456 },
  { name: 'B-7890-MNO', km: 980 },
];

const vehicleTypes = [
  { name: 'Furgonetas', value: 3, color: '#3b82f6' },
  { name: 'Camiones 3.5T', value: 2, color: '#10b981' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Activo</Badge>;
    case 'maintenance': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Mantenimiento</Badge>;
    case 'inactive': return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Inactivo</Badge>;
    default: return null;
  }
};

const getFuelColor = (fuel: number) => {
  if (fuel >= 60) return 'text-emerald-400';
  if (fuel >= 30) return 'text-amber-400';
  return 'text-red-400';
};

export const LogisticsFleetModule: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = vehicles.filter(v => {
    const matchesFilter = filter === 'all' || v.status === filter;
    const matchesSearch = 
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driver.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Total Vehículos', value: vehicles.length, icon: Truck, color: 'text-blue-400' },
    { label: 'Activos', value: vehicles.filter(v => v.status === 'active').length, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'En Mantenimiento', value: vehicles.filter(v => v.status === 'maintenance').length, icon: Wrench, color: 'text-amber-400' },
    { label: 'Eficiencia Media', value: Math.round(vehicles.filter(v => v.efficiency > 0).reduce((a, b) => a + b.efficiency, 0) / vehicles.filter(v => v.efficiency > 0).length) + '%', icon: TrendingUp, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-400" />
            Gestión de Flotas
          </h1>
          <p className="text-slate-400 mt-1">Control de vehículos y conductores</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Vehículo
        </Button>
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
                <div className={`p-3 rounded-xl bg-slate-700/50`}>
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

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Km Recorridos (Semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={kmByVehicle}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="km" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              Tipos de Vehículos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-8">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={vehicleTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {vehicleTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {vehicleTypes.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por matrícula o conductor..."
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
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredVehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      vehicle.status === 'active' ? 'bg-blue-500/20' :
                      vehicle.status === 'maintenance' ? 'bg-amber-500/20' : 'bg-slate-500/20'
                    }`}>
                      <Truck className={`w-7 h-7 ${
                        vehicle.status === 'active' ? 'text-blue-400' :
                        vehicle.status === 'maintenance' ? 'text-amber-400' : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-white text-lg">{vehicle.plate}</p>
                      <p className="text-sm text-slate-400">{vehicle.brand} {vehicle.model}</p>
                      <p className="text-xs text-slate-500">{vehicle.type}</p>
                    </div>
                  </div>
                  {getStatusBadge(vehicle.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-white">{vehicle.driver}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-white">{vehicle.km.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-400">{vehicle.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-400">{vehicle.nextService}</span>
                  </div>
                </div>

                {vehicle.status === 'active' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Fuel className="w-3 h-3" /> Combustible
                        </span>
                        <span className={`text-sm font-medium ${getFuelColor(vehicle.fuel)}`}>{vehicle.fuel}%</span>
                      </div>
                      <Progress value={vehicle.fuel} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Eficiencia
                        </span>
                        <span className="text-sm font-medium text-emerald-400">{vehicle.efficiency}%</span>
                      </div>
                      <Progress value={vehicle.efficiency} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LogisticsFleetModule;
