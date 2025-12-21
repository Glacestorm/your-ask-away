import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Lock, Paperclip, Search, Plus, User, Calendar,
  Filter, Activity, Heart, Pill, TrendingUp, Clock,
  AlertTriangle, CheckCircle2, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Cell
} from 'recharts';

interface Patient {
  id: string;
  name: string;
  dni: string;
  lastVisit: string;
  age: number;
  records: number;
  status: 'active' | 'pending' | 'critical';
  conditions: string[];
  nextAppointment?: string;
}

const patients: Patient[] = [
  { 
    id: '1', 
    name: 'María García López', 
    dni: '12345678A', 
    lastVisit: '2024-01-15', 
    age: 45, 
    records: 12,
    status: 'active',
    conditions: ['Hipertensión', 'Diabetes Tipo 2'],
    nextAppointment: '2024-02-20'
  },
  { 
    id: '2', 
    name: 'Juan Pérez Martín', 
    dni: '23456789B', 
    lastVisit: '2024-01-14', 
    age: 62, 
    records: 28,
    status: 'critical',
    conditions: ['Cardiopatía', 'Hipertensión'],
    nextAppointment: '2024-02-10'
  },
  { 
    id: '3', 
    name: 'Ana Rodríguez Sanz', 
    dni: '34567890C', 
    lastVisit: '2024-01-10', 
    age: 33, 
    records: 5,
    status: 'active',
    conditions: ['Alergias'],
  },
  { 
    id: '4', 
    name: 'Pedro Fernández Gil', 
    dni: '45678901D', 
    lastVisit: '2024-01-08', 
    age: 55, 
    records: 15,
    status: 'pending',
    conditions: ['Diabetes Tipo 2'],
    nextAppointment: '2024-02-15'
  },
  { 
    id: '5', 
    name: 'Laura Martínez Ruiz', 
    dni: '56789012E', 
    lastVisit: '2024-01-05', 
    age: 28, 
    records: 3,
    status: 'active',
    conditions: [],
  },
];

const visitsByMonth = [
  { month: 'Sep', visitas: 145 },
  { month: 'Oct', visitas: 168 },
  { month: 'Nov', visitas: 152 },
  { month: 'Dic', visitas: 134 },
  { month: 'Ene', visitas: 178 },
  { month: 'Feb', visitas: 89 },
];

const ageDistribution = [
  { name: '18-30', value: 25, color: '#3b82f6' },
  { name: '31-45', value: 35, color: '#10b981' },
  { name: '46-60', value: 28, color: '#f59e0b' },
  { name: '60+', value: 12, color: '#8b5cf6' },
];

const conditionsData = [
  { condition: 'Hipertensión', count: 45 },
  { condition: 'Diabetes', count: 32 },
  { condition: 'Cardiopatía', count: 18 },
  { condition: 'Alergias', count: 28 },
  { condition: 'Otros', count: 22 },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Activo</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendiente</Badge>;
    case 'critical':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Crítico</Badge>;
    default:
      return null;
  }
};

export const HealthcareRecordsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredPatients = patients.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dni.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Total Pacientes', value: patients.length, icon: User, color: 'text-blue-400' },
    { label: 'Expedientes', value: patients.reduce((a, b) => a + b.records, 0), icon: FileText, color: 'text-emerald-400' },
    { label: 'Críticos', value: patients.filter(p => p.status === 'critical').length, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Visitas (Mes)', value: 178, icon: Activity, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-400" />
            Expedientes Médicos
          </h1>
          <p className="text-slate-400 mt-1">Historial clínico digital seguro</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Paciente
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
          { icon: FileText, label: 'Historia Clínica', color: 'text-red-400', bg: 'bg-red-500/20' },
          { icon: Lock, label: 'Encriptación', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
          { icon: Paperclip, label: 'Adjuntos', color: 'text-blue-400', bg: 'bg-blue-500/20' },
          { icon: Search, label: 'Búsqueda Avanzada', color: 'text-violet-400', bg: 'bg-violet-500/20' },
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
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="statistics">Estadísticas</TabsTrigger>
          <TabsTrigger value="conditions">Patologías</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-6">
          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre, DNI o número de expediente..."
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
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="critical">Críticos</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Patients List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
                        patient.status === 'critical' ? 'bg-red-500/20' :
                        patient.status === 'pending' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                      }`}>
                        <User className={`h-7 w-7 ${
                          patient.status === 'critical' ? 'text-red-400' :
                          patient.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white">{patient.name}</h3>
                          {getStatusBadge(patient.status)}
                        </div>
                        <p className="text-sm text-slate-400">DNI: {patient.dni}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {patient.age} años
                          </span>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            <FileText className="h-3 w-3 mr-1" />
                            {patient.records} registros
                          </Badge>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Última: {patient.lastVisit}
                          </span>
                        </div>
                        {patient.conditions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {patient.conditions.map((condition) => (
                              <Badge key={condition} className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                <Heart className="h-3 w-3 mr-1" />
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {patient.nextAppointment && (
                          <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <p className="text-xs text-blue-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Próxima cita: {patient.nextAppointment}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <Eye className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Visits by Month */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Visitas por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={visitsByMonth}>
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
                    <Bar dataKey="visitas" fill="#10b981" name="Visitas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Age Distribution */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Distribución por Edad
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-8">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={ageDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {ageDistribution.map((entry, index) => (
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
                  {ageDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-white">{item.name} años</span>
                      <span className="text-slate-400">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                Patologías más Frecuentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conditionsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="condition" type="category" stroke="#94a3b8" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#ef4444" name="Pacientes" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conditions Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {conditionsData.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.condition}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <Heart className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-2xl font-bold text-red-400">{item.count}</span>
                    </div>
                    <p className="text-white font-medium">{item.condition}</p>
                    <p className="text-sm text-slate-400">pacientes afectados</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HealthcareRecordsModule;
