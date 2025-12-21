import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Folder, Search, Filter, Plus, Users, Clock, Euro, Calendar,
  FileText, AlertTriangle, CheckCircle, XCircle, ArrowUpRight, TrendingUp,
  Gavel, Scale, Briefcase, Target, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';

const casesByMonthData = [
  { month: 'Ene', nuevos: 8, cerrados: 5, facturado: 12500 },
  { month: 'Feb', nuevos: 12, cerrados: 7, facturado: 18200 },
  { month: 'Mar', nuevos: 6, cerrados: 9, facturado: 15800 },
  { month: 'Abr', nuevos: 15, cerrados: 8, facturado: 22500 },
  { month: 'May', nuevos: 9, cerrados: 11, facturado: 19800 },
  { month: 'Jun', nuevos: 11, cerrados: 6, facturado: 17500 },
];

const statusData = [
  { name: 'Activos', value: 24, color: '#10b981' },
  { name: 'En espera', value: 12, color: '#f59e0b' },
  { name: 'En juicio', value: 8, color: '#8b5cf6' },
  { name: 'Cerrados', value: 45, color: '#6b7280' },
];

const typeDistribution = [
  { name: 'Mercantil', value: 35, color: '#8b5cf6' },
  { name: 'Laboral', value: 28, color: '#3b82f6' },
  { name: 'Civil', value: 22, color: '#10b981' },
  { name: 'Fiscal', value: 15, color: '#f59e0b' },
];

const billingTrendData = [
  { month: 'Ene', importe: 12500 },
  { month: 'Feb', importe: 18200 },
  { month: 'Mar', importe: 15800 },
  { month: 'Abr', importe: 22500 },
  { month: 'May', importe: 19800 },
  { month: 'Jun', importe: 21500 },
];

export const LegalCasesModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('expedientes');

  const cases = [
    { id: 'EXP-2024-001', client: 'Empresa ABC S.L.', type: 'Mercantil', status: 'active', priority: 'high', hours: 45.5, billing: 5460, team: ['MGL', 'JRS'], deadline: '2024-02-15', progress: 65 },
    { id: 'EXP-2024-002', client: 'García Hermanos', type: 'Laboral', status: 'active', priority: 'medium', hours: 23.0, billing: 2760, team: ['ALP'], deadline: '2024-02-20', progress: 40 },
    { id: 'EXP-2024-003', client: 'Constructora Norte', type: 'Civil', status: 'pending', priority: 'high', hours: 12.5, billing: 1500, team: ['MGL', 'ALP'], deadline: '2024-02-10', progress: 25 },
    { id: 'EXP-2024-004', client: 'Inversiones Sur', type: 'Fiscal', status: 'trial', priority: 'critical', hours: 68.0, billing: 10200, team: ['JRS', 'MGL', 'ALP'], deadline: '2024-02-05', progress: 80 },
    { id: 'EXP-2024-005', client: 'Tech Solutions', type: 'Mercantil', status: 'closed', priority: 'low', hours: 34.0, billing: 4080, team: ['JRS'], deadline: null, progress: 100 },
    { id: 'EXP-2024-006', client: 'Retail Partners', type: 'Laboral', status: 'active', priority: 'medium', hours: 18.5, billing: 2220, team: ['ALP', 'JRS'], deadline: '2024-03-01', progress: 55 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Activo</Badge>;
      case 'pending': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">En Espera</Badge>;
      case 'trial': return <Badge className="bg-violet-500/20 text-violet-500 border-violet-500/30">En Juicio</Badge>;
      case 'closed': return <Badge variant="outline" className="text-muted-foreground">Cerrado</Badge>;
      default: return null;
    }
  };

  const getPriorityIndicator = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-amber-500',
      low: 'bg-blue-500'
    };
    return <div className={`h-2 w-2 rounded-full ${colors[priority] || 'bg-gray-500'}`} />;
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || c.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const activeCases = cases.filter(c => c.status !== 'closed').length;
  const totalHours = cases.reduce((s, c) => s + c.hours, 0);
  const totalBilling = cases.reduce((s, c) => s + c.billing, 0);
  const urgentCases = cases.filter(c => c.priority === 'critical' || c.priority === 'high').length;

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
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Expedientes</h2>
            <p className="text-muted-foreground">Gestión integral de casos legales</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Expediente
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expedientes Activos</p>
                <p className="text-3xl font-bold">{activeCases}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+5 este mes</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Folder className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas Registradas</p>
                <p className="text-3xl font-bold">{totalHours}h</p>
                <span className="text-xs text-muted-foreground">Este mes</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Facturación Pte.</p>
                <p className="text-3xl font-bold">{totalBilling.toLocaleString()}€</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+12%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Euro className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Casos Urgentes</p>
                <p className="text-3xl font-bold">{urgentCases}</p>
                <span className="text-xs text-orange-500">Requieren atención</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="expedientes">Expedientes</TabsTrigger>
          <TabsTrigger value="analiticas">Analíticas</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
        </TabsList>

        <TabsContent value="expedientes" className="space-y-4 mt-4">
          {/* Search and Filter */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente o expediente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'pending', 'trial', 'closed'].map((filter) => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                  className={selectedFilter === filter ? 'bg-violet-500 hover:bg-violet-600' : ''}
                >
                  {filter === 'all' ? 'Todos' : filter === 'active' ? 'Activos' : filter === 'pending' ? 'En Espera' : filter === 'trial' ? 'Juicio' : 'Cerrados'}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Cases List */}
          <motion.div variants={itemVariants} className="space-y-3">
            {filteredCases.map((caseItem, index) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:border-violet-500/50 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-purple-500/30 transition-colors">
                          <Folder className="h-6 w-6 text-violet-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {getPriorityIndicator(caseItem.priority)}
                            <p className="font-medium">{caseItem.client}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{caseItem.id} · {caseItem.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="hidden md:block">
                          <div className="flex -space-x-2">
                            {caseItem.team.map((member, i) => (
                              <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium border-2 border-background">
                                {member}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="w-32 hidden lg:block">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-medium">{caseItem.progress}%</span>
                          </div>
                          <Progress value={caseItem.progress} className="h-1.5" />
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium">{caseItem.hours}h</p>
                          <p className="text-xs text-muted-foreground">{caseItem.billing.toLocaleString()}€</p>
                        </div>
                        
                        {caseItem.deadline && (
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-muted-foreground">Vencimiento</p>
                            <p className="text-sm font-medium">{caseItem.deadline}</p>
                          </div>
                        )}
                        
                        {getStatusBadge(caseItem.status)}
                        
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="analiticas" className="space-y-4 mt-4">
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-violet-500" />
                  Expedientes por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={casesByMonthData}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="nuevos" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Nuevos" />
                    <Bar dataKey="cerrados" fill="#10b981" radius={[4, 4, 0, 0]} name="Cerrados" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Euro className="h-5 w-5 text-violet-500" />
                  Tendencia Facturación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={billingTrendData}>
                    <defs>
                      <linearGradient id="billingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => `${value.toLocaleString()}€`} />
                    <Area type="monotone" dataKey="importe" stroke="#8b5cf6" fill="url(#billingGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-violet-500" />
                  Por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {statusData.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="h-5 w-5 text-violet-500" />
                  Por Tipo de Caso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {typeDistribution.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="calendario" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-500" />
                Próximos Vencimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cases.filter(c => c.deadline).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()).map((caseItem, index) => (
                  <motion.div
                    key={caseItem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-violet-500" />
                      </div>
                      <div>
                        <p className="font-medium">{caseItem.client}</p>
                        <p className="text-sm text-muted-foreground">{caseItem.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{caseItem.deadline}</p>
                        <p className="text-xs text-muted-foreground">{caseItem.type}</p>
                      </div>
                      {getStatusBadge(caseItem.status)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
