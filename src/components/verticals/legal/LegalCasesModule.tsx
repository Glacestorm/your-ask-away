import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Folder, Flag, Users, History, Plus, Clock, Euro, Search, Filter, Calendar, FileText, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const casesByMonthData = [
  { month: 'Ene', nuevos: 8, cerrados: 5 },
  { month: 'Feb', nuevos: 12, cerrados: 7 },
  { month: 'Mar', nuevos: 10, cerrados: 9 },
  { month: 'Abr', nuevos: 15, cerrados: 8 },
  { month: 'May', nuevos: 11, cerrados: 12 },
  { month: 'Jun', nuevos: 9, cerrados: 10 },
];

const statusData = [
  { name: 'Activo', value: 45, color: '#10b981' },
  { name: 'Pendiente', value: 20, color: '#f59e0b' },
  { name: 'En Revisión', value: 15, color: '#3b82f6' },
  { name: 'Cerrado', value: 20, color: '#6b7280' },
];

export const LegalCasesModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const cases = [
    { id: 'EXP-2024-001', client: 'Empresa ABC S.L.', type: 'Mercantil', team: ['Ana G.', 'Pedro M.'], openDate: '2024-01-05', hours: 45.5, status: 'active', priority: 'high', nextDeadline: '2024-02-15' },
    { id: 'EXP-2024-002', client: 'García Hermanos', type: 'Laboral', team: ['María L.'], openDate: '2024-01-10', hours: 23.0, status: 'active', priority: 'medium', nextDeadline: '2024-02-20' },
    { id: 'EXP-2024-003', client: 'Constructora Norte', type: 'Civil', team: ['Ana G.', 'Juan R.'], openDate: '2024-01-12', hours: 12.5, status: 'pending', priority: 'high', nextDeadline: '2024-02-10' },
    { id: 'EXP-2024-004', client: 'Inversiones Sur S.A.', type: 'Fiscal', team: ['Pedro M.'], openDate: '2024-01-15', hours: 8.0, status: 'review', priority: 'low', nextDeadline: '2024-02-25' },
    { id: 'EXP-2024-005', client: 'Tech Solutions', type: 'Mercantil', team: ['María L.', 'Juan R.'], openDate: '2024-01-18', hours: 18.5, status: 'active', priority: 'medium', nextDeadline: '2024-02-18' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Activo</Badge>;
      case 'pending': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Pendiente</Badge>;
      case 'review': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">En Revisión</Badge>;
      case 'closed': return <Badge variant="outline">Cerrado</Badge>;
      default: return null;
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'high': return <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />;
      case 'medium': return <div className="h-2 w-2 rounded-full bg-amber-500" />;
      case 'low': return <div className="h-2 w-2 rounded-full bg-emerald-500" />;
      default: return null;
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || c.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Folder className="h-5 w-5 text-white" />
            </div>
            Expedientes
          </h2>
          <p className="text-muted-foreground">Gestión de casos legales</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Expediente
        </Button>
      </motion.div>

      {/* Features */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Folder, label: 'Registro Casos', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25', count: 45 },
          { icon: Flag, label: 'Estados', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25', count: 4 },
          { icon: Users, label: 'Equipo Asignado', color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25', count: 8 },
          { icon: History, label: 'Historial', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25', count: 156 },
        ].map((feature, i) => (
          <motion.div key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="cursor-pointer hover:border-violet-500/50 transition-all group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg ${feature.shadow}`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-medium text-sm">{feature.label}</span>
                  <p className="text-xs text-muted-foreground">{feature.count}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-500" />
              Expedientes por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={casesByMonthData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="nuevos" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Nuevos" />
                <Bar dataKey="cerrados" fill="#10b981" radius={[4, 4, 0, 0]} name="Cerrados" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flag className="h-5 w-5 text-violet-500" />
              Por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {statusData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente o expediente..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'pending', 'review'].map((filter) => (
            <Button 
              key={filter}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter)}
              className={selectedFilter === filter ? 'bg-violet-500 hover:bg-violet-600' : ''}
            >
              {filter === 'all' ? 'Todos' : filter === 'active' ? 'Activos' : filter === 'pending' ? 'Pendientes' : 'Revisión'}
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-purple-500/30 transition-colors">
                      <Folder className="h-6 w-6 text-violet-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getPriorityIndicator(caseItem.priority)}
                        <p className="font-medium">{caseItem.client}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{caseItem.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(caseItem.status)}
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Tipo</p>
                    <p className="font-medium">{caseItem.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Equipo</p>
                    <p className="font-medium">{caseItem.team.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Apertura</p>
                    <p className="font-medium">{caseItem.openDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Horas</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {caseItem.hours}h
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Próximo Vencimiento</p>
                    <p className="font-medium text-amber-500">{caseItem.nextDeadline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};
