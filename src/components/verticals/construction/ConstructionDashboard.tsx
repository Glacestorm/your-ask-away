import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  HardHat, FileCheck, Users, Calculator, 
  Calendar, TrendingUp, AlertTriangle, Euro, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  spent: number;
  progress: number;
  status: 'active' | 'paused' | 'completed';
  certifications: number;
  pendingCertification: number;
}

const monthlyData = [
  { month: 'Ene', ejecutado: 850000, certificado: 780000 },
  { month: 'Feb', ejecutado: 920000, certificado: 850000 },
  { month: 'Mar', ejecutado: 1100000, certificado: 1020000 },
  { month: 'Abr', ejecutado: 980000, certificado: 920000 },
  { month: 'May', ejecutado: 1250000, certificado: 1180000 },
  { month: 'Jun', ejecutado: 1150000, certificado: 1080000 },
];

const projectTypeData = [
  { name: 'Residencial', value: 45, color: '#f97316' },
  { name: 'Comercial', value: 25, color: '#3b82f6' },
  { name: 'Industrial', value: 20, color: '#10b981' },
  { name: 'Reforma', value: 10, color: '#8b5cf6' },
];

const resourceData = [
  { day: 'Lun', personal: 45, maquinaria: 12 },
  { day: 'Mar', personal: 52, maquinaria: 14 },
  { day: 'Mié', personal: 48, maquinaria: 13 },
  { day: 'Jue', personal: 55, maquinaria: 15 },
  { day: 'Vie', personal: 50, maquinaria: 14 },
  { day: 'Sáb', personal: 28, maquinaria: 8 },
];

export const ConstructionDashboard: React.FC = () => {
  const projects: Project[] = [
    { id: '1', name: 'Edificio Residencial Aurora', client: 'Inmobiliaria Norte S.A.', budget: 2500000, spent: 1875000, progress: 75, status: 'active', certifications: 8, pendingCertification: 156000 },
    { id: '2', name: 'Centro Comercial Plaza Mayor', client: 'Centros Comerciales SL', budget: 8000000, spent: 2400000, progress: 30, status: 'active', certifications: 3, pendingCertification: 320000 },
    { id: '3', name: 'Nave Industrial P-47', client: 'Logística Express', budget: 1200000, spent: 1140000, progress: 95, status: 'active', certifications: 10, pendingCertification: 60000 },
    { id: '4', name: 'Reforma Hotel Marina', client: 'Hoteles Costa SA', budget: 450000, spent: 450000, progress: 100, status: 'completed', certifications: 5, pendingCertification: 0 },
  ];

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const pendingCertifications = projects.reduce((s, p) => s + p.pendingCertification, 0);

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">En Curso</Badge>;
      case 'paused': return <Badge variant="outline">Pausado</Badge>;
      case 'completed': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Completado</Badge>;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
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
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <HardHat className="h-6 w-6 text-white" />
            </div>
            Construcción
          </h1>
          <p className="text-muted-foreground mt-1">Gestión integral de obras y proyectos</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25">
          <HardHat className="h-4 w-4 mr-2" />
          Nueva Obra
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Obras Activas</p>
                <p className="text-3xl font-bold mt-1">{projects.filter(p => p.status === 'active').length}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+1 este mes</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <HardHat className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Presupuesto Total</p>
                <p className="text-3xl font-bold mt-1">{(totalBudget / 1000000).toFixed(1)}M €</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">{projects.length} proyectos</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Euro className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ejecutado</p>
                <p className="text-3xl font-bold mt-1">{((totalSpent / totalBudget) * 100).toFixed(0)}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">En plazo</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cert. Pendientes</p>
                <p className="text-3xl font-bold mt-1">{(pendingCertifications / 1000).toFixed(0)}k €</p>
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-amber-500">3 obras</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <FileCheck className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Euro className="h-5 w-5 text-orange-500" />
              Ejecución vs Certificación Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="ejecutadoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="certificadoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `${(value/1000).toFixed(0)}k €`}
                />
                <Area type="monotone" dataKey="ejecutado" stroke="#f97316" fill="url(#ejecutadoGradient)" strokeWidth={2} name="Ejecutado" />
                <Area type="monotone" dataKey="certificado" stroke="#10b981" fill="url(#certificadoGradient)" strokeWidth={2} name="Certificado" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <HardHat className="h-5 w-5 text-orange-500" />
              Por Tipo de Obra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={projectTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {projectTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {projectTypeData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resources Chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Recursos en Obra (Semana Actual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={resourceData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="personal" fill="#f97316" radius={[4, 4, 0, 0]} name="Personal" />
                <Bar dataKey="maquinaria" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Maquinaria" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { icon: HardHat, label: 'Obras', color: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/25' },
          { icon: Users, label: 'Subcontratas', color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25' },
          { icon: FileCheck, label: 'Certificaciones', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
          { icon: Calendar, label: 'Planificación', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
          { icon: Calculator, label: 'Costes', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
          { icon: AlertTriangle, label: 'Incidencias', color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/25' },
        ].map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="w-full h-20 flex-col gap-2 group hover:border-orange-500/50 transition-all">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg ${action.shadow}`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Projects List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardHat className="h-5 w-5 text-orange-500" />
              Obras en Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:border-orange-500/50 transition-colors cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-amber-500/30 transition-colors">
                            <HardHat className="h-6 w-6 text-orange-500" />
                          </div>
                          <div>
                            <h3 className="font-medium">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">{project.client}</p>
                          </div>
                        </div>
                        {getStatusBadge(project.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Presupuesto</p>
                          <p className="font-medium">{(project.budget / 1000).toFixed(0)}k €</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ejecutado</p>
                          <p className="font-medium">{(project.spent / 1000).toFixed(0)}k €</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Certificaciones</p>
                          <p className="font-medium">{project.certifications}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pte. Certificar</p>
                          <p className="font-medium text-amber-500">{(project.pendingCertification / 1000).toFixed(0)}k €</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avance</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
