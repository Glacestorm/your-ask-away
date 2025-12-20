import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  BookOpen,
  Heart,
  Target,
  Award,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Academic performance data
const academicPerformance = [
  { subject: 'Idiomas', average: 8.2, pass_rate: 92 },
  { subject: 'Tecnología', average: 7.8, pass_rate: 88 },
  { subject: 'Arte', average: 8.5, pass_rate: 95 },
  { subject: 'Negocios', average: 7.5, pass_rate: 85 },
  { subject: 'Deportes', average: 8.8, pass_rate: 98 },
];

// Enrollment trend
const enrollmentTrend = [
  { month: 'Sep', total: 980, new: 120, dropouts: 15 },
  { month: 'Oct', total: 1020, new: 55, dropouts: 15 },
  { month: 'Nov', total: 1080, new: 75, dropouts: 15 },
  { month: 'Dic', total: 1100, new: 35, dropouts: 15 },
  { month: 'Ene', total: 1180, new: 95, dropouts: 15 },
  { month: 'Feb', total: 1247, new: 82, dropouts: 15 },
];

// Impact metrics for NGO
const impactMetrics = [
  { name: 'Becas Otorgadas', value: 156, target: 200, icon: Award },
  { name: 'Familias Apoyadas', value: 89, target: 100, icon: Users },
  { name: 'Horas de Formación', value: 12500, target: 15000, icon: BookOpen },
  { name: 'Voluntarios Activos', value: 45, target: 50, icon: Heart },
];

// Radar data for impact areas
const radarData = [
  { area: 'Educación', value: 85 },
  { area: 'Alimentación', value: 70 },
  { area: 'Salud', value: 65 },
  { area: 'Empleo', value: 55 },
  { area: 'Vivienda', value: 40 },
  { area: 'Integración', value: 75 },
];

// Funding distribution
const fundingDistribution = [
  { name: 'Programas Educativos', value: 45, color: '#3b82f6' },
  { name: 'Becas', value: 25, color: '#10b981' },
  { name: 'Infraestructura', value: 15, color: '#8b5cf6' },
  { name: 'Personal', value: 10, color: '#f59e0b' },
  { name: 'Administración', value: 5, color: '#64748b' },
];

// Report templates
const reportTemplates = [
  { id: 1, name: 'Informe Académico Trimestral', type: 'academic', frequency: 'Trimestral' },
  { id: 2, name: 'Memoria Anual de Actividades', type: 'annual', frequency: 'Anual' },
  { id: 3, name: 'Informe de Impacto Social', type: 'impact', frequency: 'Semestral' },
  { id: 4, name: 'Balance Económico', type: 'financial', frequency: 'Mensual' },
  { id: 5, name: 'Certificación para Donantes', type: 'donors', frequency: 'Bajo demanda' },
];

export const EducationReportsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('academic');
  const [period, setPeriod] = useState('2024-Q1');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            Informes y Análisis
          </h1>
          <p className="text-slate-400 mt-1">Reportes académicos, impacto social y cumplimiento normativo</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px] bg-slate-900 border-slate-600 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-Q1">Q1 2024</SelectItem>
              <SelectItem value="2023-Q4">Q4 2023</SelectItem>
              <SelectItem value="2023-Q3">Q3 2023</SelectItem>
              <SelectItem value="2023">Año 2023</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Generar Informe
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="academic">Académico</TabsTrigger>
          <TabsTrigger value="impact">Impacto Social</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="space-y-6">
          {/* Academic Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-emerald-400">8.1</p>
                <p className="text-sm text-slate-400">Nota Media General</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">91.5%</p>
                <p className="text-sm text-slate-400">Tasa de Aprobados</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">94.2%</p>
                <p className="text-sm text-slate-400">Asistencia Media</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-400">156</p>
                <p className="text-sm text-slate-400">Certificados Emitidos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Enrollment Trend */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Evolución de Matriculaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={enrollmentTrend}>
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
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#3b82f620" name="Total" />
                    <Area type="monotone" dataKey="new" stroke="#10b981" fill="#10b98120" name="Nuevos" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance by Subject */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Rendimiento por Área
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {academicPerformance.map((subject) => (
                    <div key={subject.subject}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{subject.subject}</span>
                        <span className="text-slate-400">
                          Media: <span className="text-emerald-400 font-medium">{subject.average}</span> | 
                          Aprobados: <span className="text-blue-400 font-medium">{subject.pass_rate}%</span>
                        </span>
                      </div>
                      <Progress value={subject.pass_rate} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          {/* Impact Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {impactMetrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <metric.icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-sm text-slate-400">{metric.name}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-white">{metric.value.toLocaleString()}</span>
                      <span className="text-sm text-slate-500">/ {metric.target.toLocaleString()}</span>
                    </div>
                    <Progress value={(metric.value / metric.target) * 100} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-pink-400" />
                  Áreas de Impacto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="area" stroke="#94a3b8" />
                    <PolarRadiusAxis stroke="#94a3b8" />
                    <Radar
                      name="Impacto"
                      dataKey="value"
                      stroke="#ec4899"
                      fill="#ec489940"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Achievements */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Logros Destacados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: '156 becas otorgadas', desc: 'Superado objetivo del 78%', color: 'emerald' },
                  { title: '89 familias apoyadas', desc: 'Programa de integración', color: 'blue' },
                  { title: '12.500 horas formativas', desc: 'Récord histórico', color: 'purple' },
                  { title: '€120.000 recaudados', desc: 'Campaña anual exitosa', color: 'pink' },
                ].map((achievement, i) => (
                  <div 
                    key={i}
                    className={`p-4 rounded-lg border ${
                      achievement.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30' :
                      achievement.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
                      achievement.color === 'purple' ? 'bg-purple-500/10 border-purple-500/30' :
                      'bg-pink-500/10 border-pink-500/30'
                    }`}
                  >
                    <p className="text-white font-medium">{achievement.title}</p>
                    <p className="text-sm text-slate-400">{achievement.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Funding Distribution */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-blue-400" />
                  Distribución de Fondos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={fundingDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {fundingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {fundingDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-400">{item.name}</span>
                      <span className="text-sm text-white font-medium ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Ingresos Totales</span>
                    <span className="text-2xl font-bold text-emerald-400">€245.680</span>
                  </div>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Gastos Totales</span>
                    <span className="text-2xl font-bold text-red-400">€198.450</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Balance</span>
                    <span className="text-2xl font-bold text-blue-400">€47.230</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Ratio de eficiencia</span>
                    <span className="text-emerald-400 font-medium">92.3%</span>
                  </div>
                  <Progress value={92.3} className="h-2 mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Plantillas de Informes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        template.type === 'academic' ? 'bg-blue-500/20' :
                        template.type === 'annual' ? 'bg-purple-500/20' :
                        template.type === 'impact' ? 'bg-pink-500/20' :
                        template.type === 'financial' ? 'bg-emerald-500/20' :
                        'bg-amber-500/20'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          template.type === 'academic' ? 'text-blue-400' :
                          template.type === 'annual' ? 'text-purple-400' :
                          template.type === 'impact' ? 'text-pink-400' :
                          template.type === 'financial' ? 'text-emerald-400' :
                          'text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{template.name}</p>
                        <p className="text-sm text-slate-400">Frecuencia: {template.frequency}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="border-slate-600 text-slate-300">
                      <Download className="w-4 h-4 mr-2" />
                      Generar
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationReportsModule;
