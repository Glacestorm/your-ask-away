import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Plus,
  Search,
  Filter,
  Clock,
  Users,
  Calendar,
  Star,
  Play,
  FileText,
  Video,
  Download,
  TrendingUp,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface Course {
  id: string;
  name: string;
  category: string;
  instructor: string;
  duration: string;
  students: number;
  maxStudents: number;
  startDate: string;
  endDate: string;
  schedule: string;
  status: 'active' | 'upcoming' | 'completed' | 'draft';
  rating: number;
  progress?: number;
  materials: number;
  price?: number;
}

const courses: Course[] = [
  {
    id: 'CRS-001',
    name: 'Inglés B2 - Preparación Cambridge',
    category: 'Idiomas',
    instructor: 'Sarah Johnson',
    duration: '6 meses',
    students: 24,
    maxStudents: 25,
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    schedule: 'Lun y Mié 18:00-20:00',
    status: 'active',
    rating: 4.8,
    progress: 45,
    materials: 32,
    price: 450
  },
  {
    id: 'CRS-002',
    name: 'Python para Principiantes',
    category: 'Tecnología',
    instructor: 'Carlos Dev',
    duration: '3 meses',
    students: 18,
    maxStudents: 20,
    startDate: '2024-02-01',
    endDate: '2024-04-30',
    schedule: 'Mar y Jue 17:00-19:00',
    status: 'active',
    rating: 4.9,
    progress: 30,
    materials: 24,
    price: 350
  },
  {
    id: 'CRS-003',
    name: 'Marketing Digital Avanzado',
    category: 'Negocio',
    instructor: 'Ana Marketing',
    duration: '2 meses',
    students: 15,
    maxStudents: 20,
    startDate: '2024-03-01',
    endDate: '2024-04-30',
    schedule: 'Vie 16:00-19:00',
    status: 'upcoming',
    rating: 0,
    materials: 18,
    price: 280
  },
  {
    id: 'CRS-004',
    name: 'Diseño Gráfico con Adobe',
    category: 'Arte',
    instructor: 'Laura Diseñadora',
    duration: '4 meses',
    students: 12,
    maxStudents: 15,
    startDate: '2023-09-01',
    endDate: '2023-12-20',
    schedule: 'Lun y Mié 10:00-12:00',
    status: 'completed',
    rating: 4.7,
    progress: 100,
    materials: 45,
    price: 400
  },
  {
    id: 'CRS-005',
    name: 'Fotografía Digital',
    category: 'Arte',
    instructor: 'Pedro Fotógrafo',
    duration: '2 meses',
    students: 0,
    maxStudents: 12,
    startDate: '',
    endDate: '',
    schedule: 'Por definir',
    status: 'draft',
    rating: 0,
    materials: 8,
    price: 200
  },
];

const coursesByCategory = [
  { category: 'Idiomas', cursos: 12, alumnos: 180 },
  { category: 'Tecnología', cursos: 8, alumnos: 120 },
  { category: 'Negocio', cursos: 6, alumnos: 85 },
  { category: 'Arte', cursos: 5, alumnos: 60 },
];

const categoryDistribution = [
  { name: 'Idiomas', value: 35, color: '#3b82f6' },
  { name: 'Tecnología', value: 28, color: '#10b981' },
  { name: 'Negocio', value: 22, color: '#f59e0b' },
  { name: 'Arte', value: 15, color: '#8b5cf6' },
];

const courseQuality = [
  { subject: 'Contenido', A: 92 },
  { subject: 'Instructor', A: 95 },
  { subject: 'Materiales', A: 88 },
  { subject: 'Prácticas', A: 85 },
  { subject: 'Soporte', A: 90 },
];

const materials = [
  { id: 1, name: 'Introducción al curso', type: 'video', duration: '15 min', course: 'Inglés B2' },
  { id: 2, name: 'Gramática Unidad 1', type: 'pdf', size: '2.4 MB', course: 'Inglés B2' },
  { id: 3, name: 'Ejercicios Prácticos', type: 'pdf', size: '1.8 MB', course: 'Inglés B2' },
  { id: 4, name: 'Listening Practice', type: 'audio', duration: '25 min', course: 'Inglés B2' },
  { id: 5, name: 'Variables y Tipos de Datos', type: 'video', duration: '45 min', course: 'Python' },
  { id: 6, name: 'Código de Ejemplo', type: 'code', size: '12 KB', course: 'Python' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Activo</Badge>;
    case 'upcoming':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Próximo</Badge>;
    case 'completed':
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Finalizado</Badge>;
    case 'draft':
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Borrador</Badge>;
    default:
      return null;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Idiomas': return 'bg-blue-500/20 text-blue-400';
    case 'Tecnología': return 'bg-emerald-500/20 text-emerald-400';
    case 'Negocio': return 'bg-amber-500/20 text-amber-400';
    case 'Arte': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-slate-500/20 text-slate-400';
  }
};

const getMaterialIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video className="w-4 h-4 text-red-400" />;
    case 'pdf': return <FileText className="w-4 h-4 text-blue-400" />;
    case 'audio': return <Play className="w-4 h-4 text-amber-400" />;
    case 'code': return <FileText className="w-4 h-4 text-emerald-400" />;
    default: return <FileText className="w-4 h-4 text-slate-400" />;
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const EducationCoursesModule: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('courses');

  const filteredCourses = courses.filter(course => {
    const matchesFilter = filter === 'all' || course.status === filter;
    const matchesSearch = 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Total Cursos', value: courses.length, icon: BookOpen, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    { label: 'Activos', value: courses.filter(c => c.status === 'active').length, icon: Play, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { label: 'Alumnos Inscritos', value: courses.reduce((s, c) => s + c.students, 0), icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { label: 'Valoración Media', value: '4.8', icon: Star, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-400" />
            Gestión de Cursos
          </h1>
          <p className="text-slate-400 mt-1">Catálogo de cursos, programación y materiales didácticos</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      {/* Stats */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="materials">Materiales</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar curso o instructor..."
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
                  <SelectItem value="upcoming">Próximos</SelectItem>
                  <SelectItem value="completed">Finalizados</SelectItem>
                  <SelectItem value="draft">Borradores</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Courses Grid */}
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredCourses.map((course) => (
              <motion.div key={course.id} variants={itemVariants}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all hover:shadow-lg h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge className={getCategoryColor(course.category)}>
                        {course.category}
                      </Badge>
                      {getStatusBadge(course.status)}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">{course.name}</h3>
                    <p className="text-sm text-slate-400 mb-4">Instructor: {course.instructor}</p>

                    {course.progress !== undefined && course.status === 'active' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Progreso del curso</span>
                          <span className="text-white">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Users className="w-4 h-4" />
                        {course.students}/{course.maxStudents}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <FileText className="w-4 h-4" />
                        {course.materials} materiales
                      </div>
                      {course.rating > 0 && (
                        <div className="flex items-center gap-2 text-sm text-amber-400">
                          <Star className="w-4 h-4 fill-current" />
                          {course.rating}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <div className="text-sm text-slate-400">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {course.schedule}
                      </div>
                      {course.price && (
                        <span className="text-lg font-bold text-emerald-400">€{course.price}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Cursos por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={coursesByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="cursos" fill="#3b82f6" name="Cursos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="alumnos" fill="#10b981" name="Alumnos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Distribución por Área
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categoryDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-400">{item.name}</span>
                      <span className="text-sm text-white font-medium ml-auto">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Calidad de Cursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={courseQuality}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
                  <PolarRadiusAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Radar
                    name="Valoración"
                    dataKey="A"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Biblioteca de Materiales
                </span>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Subir Material
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div 
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {materials.map((material) => (
                  <motion.div
                    key={material.id}
                    variants={itemVariants}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                        {getMaterialIcon(material.type)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{material.name}</p>
                        <p className="text-sm text-slate-400">
                          {material.course} • {material.duration || material.size}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                      <Download className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationCoursesModule;
