import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HardHat, Flag, FileText, ClipboardList, AlertTriangle, 
  Plus, Calendar, Users, MapPin, Search, Filter,
  TrendingUp, Clock, CheckCircle2, Building2, Hammer
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

interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  startDate: string;
  endDate: string;
  progress: number;
  phase: string;
  workers: number;
  subcontractors: number;
  incidents: number;
  budget: number;
  spent: number;
  status: 'on_track' | 'delayed' | 'at_risk' | 'completed';
}

const projects: Project[] = [
  { 
    id: 'PRJ-001', 
    name: 'Edificio Residencial Aurora', 
    client: 'Inmobiliaria Norte S.A.',
    location: 'Bilbao, Bizkaia',
    startDate: '2023-06-15',
    endDate: '2024-12-31',
    progress: 75,
    phase: 'Estructura',
    workers: 45,
    subcontractors: 8,
    incidents: 2,
    budget: 4500000,
    spent: 3200000,
    status: 'on_track'
  },
  { 
    id: 'PRJ-002', 
    name: 'Centro Comercial Plaza Mayor', 
    client: 'Centros Comerciales SL',
    location: 'Vitoria, Álava',
    startDate: '2024-01-10',
    endDate: '2025-06-30',
    progress: 30,
    phase: 'Cimentación',
    workers: 78,
    subcontractors: 12,
    incidents: 1,
    budget: 12000000,
    spent: 3600000,
    status: 'on_track'
  },
  { 
    id: 'PRJ-003', 
    name: 'Nave Industrial P-47', 
    client: 'Logistics Pro',
    location: 'Getafe, Madrid',
    startDate: '2023-09-01',
    endDate: '2024-06-30',
    progress: 85,
    phase: 'Acabados',
    workers: 32,
    subcontractors: 5,
    incidents: 0,
    budget: 2800000,
    spent: 2450000,
    status: 'on_track'
  },
  { 
    id: 'PRJ-004', 
    name: 'Rehabilitación Fachada Histórica', 
    client: 'Ayuntamiento de Barcelona',
    location: 'Barcelona',
    startDate: '2024-02-01',
    endDate: '2024-08-31',
    progress: 15,
    phase: 'Andamiaje',
    workers: 18,
    subcontractors: 3,
    incidents: 1,
    budget: 890000,
    spent: 180000,
    status: 'delayed'
  },
];

const progressByPhase = [
  { phase: 'Aurora', estructura: 75, instalaciones: 45, acabados: 10 },
  { phase: 'Plaza Mayor', estructura: 30, instalaciones: 0, acabados: 0 },
  { phase: 'Nave P-47', estructura: 100, instalaciones: 90, acabados: 70 },
  { phase: 'Fachada', estructura: 15, instalaciones: 0, acabados: 0 },
];

const monthlyProgress = [
  { month: 'Oct', avance: 12 },
  { month: 'Nov', avance: 18 },
  { month: 'Dic', avance: 15 },
  { month: 'Ene', avance: 22 },
  { month: 'Feb', avance: 8 },
];

const workforceDistribution = [
  { name: 'Estructura', value: 45, color: '#3b82f6' },
  { name: 'Instalaciones', value: 28, color: '#10b981' },
  { name: 'Acabados', value: 32, color: '#f59e0b' },
  { name: 'Seguridad', value: 12, color: '#8b5cf6' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'on_track': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">En Plazo</Badge>;
    case 'delayed': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Retrasada</Badge>;
    case 'at_risk': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">En Riesgo</Badge>;
    case 'completed': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Completada</Badge>;
    default: return null;
  }
};

export const ConstructionProjectsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Obras Activas', value: projects.length, icon: Building2, color: 'text-blue-400' },
    { label: 'Trabajadores', value: projects.reduce((a, b) => a + b.workers, 0), icon: Users, color: 'text-emerald-400' },
    { label: 'Incidencias', value: projects.reduce((a, b) => a + b.incidents, 0), icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'Avance Medio', value: Math.round(projects.reduce((a, b) => a + b.progress, 0) / projects.length) + '%', icon: TrendingUp, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <HardHat className="w-8 h-8 text-orange-400" />
            Gestión de Obras
          </h1>
          <p className="text-slate-400 mt-1">Control integral de proyectos de construcción</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Obra
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="progress">Avance</TabsTrigger>
          <TabsTrigger value="workforce">Personal</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar obra o cliente..."
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
                  <SelectItem value="on_track">En Plazo</SelectItem>
                  <SelectItem value="delayed">Retrasadas</SelectItem>
                  <SelectItem value="at_risk">En Riesgo</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Projects */}
          <div className="space-y-4">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors ${
                  project.status === 'delayed' ? 'border-amber-500/50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          project.status === 'on_track' ? 'bg-emerald-500/20' :
                          project.status === 'delayed' ? 'bg-amber-500/20' : 'bg-red-500/20'
                        }`}>
                          <Building2 className={`w-7 h-7 ${
                            project.status === 'on_track' ? 'text-emerald-400' :
                            project.status === 'delayed' ? 'text-amber-400' : 'text-red-400'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono text-slate-500">{project.id}</span>
                            {getStatusBadge(project.status)}
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{project.phase}</Badge>
                          </div>
                          <h3 className="text-xl font-semibold text-white">{project.name}</h3>
                          <p className="text-sm text-slate-400">{project.client}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">{project.progress}%</p>
                        <p className="text-sm text-slate-400">Avance</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-white">{project.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-white">{project.endDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-white">{project.workers} trabajadores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${project.incidents > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span className={`text-sm ${project.incidents > 0 ? 'text-amber-400' : 'text-white'}`}>
                          {project.incidents} incidencias
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Progreso de obra</span>
                        <span className="text-white">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-700">
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600">
                        <Flag className="h-4 w-4 mr-2" />
                        Hitos
                      </Button>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600">
                        <FileText className="h-4 w-4 mr-2" />
                        Documentación
                      </Button>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Partes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-orange-400" />
                  Avance por Fase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressByPhase} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" domain={[0, 100]} />
                    <YAxis dataKey="phase" type="category" stroke="#94a3b8" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="estructura" fill="#3b82f6" name="Estructura" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="instalaciones" fill="#10b981" name="Instalaciones" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="acabados" fill="#f59e0b" name="Acabados" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Avance Mensual (%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyProgress}>
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
                    <Line 
                      type="monotone" 
                      dataKey="avance" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2 }}
                      name="Avance %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workforce" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Distribución de Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center gap-12">
              <ResponsiveContainer width={250} height={250}>
                <PieChart>
                  <Pie
                    data={workforceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {workforceDistribution.map((entry, index) => (
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
              <div className="space-y-4">
                {workforceDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-slate-400 text-sm">{item.value} trabajadores</p>
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

export default ConstructionProjectsModule;
