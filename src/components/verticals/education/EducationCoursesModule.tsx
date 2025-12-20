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
  Download
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="materials">Materiales</TabsTrigger>
          <TabsTrigger value="schedule">Horarios</TabsTrigger>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors h-full">
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
          </div>
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
              <div className="space-y-3">
                {materials.map((material, index) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Horario Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2 text-center">
                {['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => (
                  <div key={day} className="p-2 bg-slate-700/50 rounded font-medium text-slate-300 text-sm">
                    {day}
                  </div>
                ))}
                {['09:00', '10:00', '11:00', '12:00', '17:00', '18:00', '19:00'].map((hour) => (
                  <React.Fragment key={hour}>
                    <div className="p-2 text-slate-400 text-sm">{hour}</div>
                    {[1, 2, 3, 4, 5].map((day) => (
                      <div 
                        key={`${hour}-${day}`} 
                        className={`p-2 rounded text-xs ${
                          (hour === '18:00' && (day === 1 || day === 3)) ? 'bg-blue-500/20 text-blue-400' :
                          (hour === '17:00' && (day === 2 || day === 4)) ? 'bg-emerald-500/20 text-emerald-400' :
                          (hour === '10:00' && (day === 1 || day === 3)) ? 'bg-purple-500/20 text-purple-400' :
                          'bg-slate-800/50 text-slate-600'
                        }`}
                      >
                        {(hour === '18:00' && (day === 1 || day === 3)) && 'Inglés B2'}
                        {(hour === '17:00' && (day === 2 || day === 4)) && 'Python'}
                        {(hour === '10:00' && (day === 1 || day === 3)) && 'Diseño'}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationCoursesModule;
