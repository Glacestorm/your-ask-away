import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  TrendingUp,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  LineChart,
  Line
} from 'recharts';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  courses: string[];
  attendance: number;
  averageGrade: number;
  status: 'active' | 'inactive' | 'graduated' | 'pending';
  tutor?: string;
}

const students: Student[] = [
  {
    id: 'STU-001',
    name: 'María García López',
    email: 'maria.garcia@email.com',
    phone: '+34 612 345 678',
    enrollmentDate: '2023-09-01',
    courses: ['Inglés B2', 'Python Básico'],
    attendance: 96,
    averageGrade: 8.5,
    status: 'active',
    tutor: 'Carlos Profesor'
  },
  {
    id: 'STU-002',
    name: 'Juan Martínez Ruiz',
    email: 'juan.martinez@email.com',
    phone: '+34 623 456 789',
    enrollmentDate: '2023-09-15',
    courses: ['Marketing Digital'],
    attendance: 88,
    averageGrade: 7.2,
    status: 'active',
  },
  {
    id: 'STU-003',
    name: 'Ana Sánchez Pérez',
    email: 'ana.sanchez@email.com',
    phone: '+34 634 567 890',
    enrollmentDate: '2023-10-01',
    courses: ['Diseño Gráfico', 'Fotografía'],
    attendance: 92,
    averageGrade: 9.1,
    status: 'active',
    tutor: 'Laura Profesora'
  },
  {
    id: 'STU-004',
    name: 'Pedro López Fernández',
    email: 'pedro.lopez@email.com',
    phone: '+34 645 678 901',
    enrollmentDate: '2022-09-01',
    courses: ['Inglés C1'],
    attendance: 100,
    averageGrade: 9.5,
    status: 'graduated',
  },
  {
    id: 'STU-005',
    name: 'Laura Torres Gil',
    email: 'laura.torres@email.com',
    phone: '+34 656 789 012',
    enrollmentDate: '2024-01-15',
    courses: ['Python Avanzado'],
    attendance: 65,
    averageGrade: 6.8,
    status: 'active',
  },
  {
    id: 'STU-006',
    name: 'Carlos Ruiz Moreno',
    email: 'carlos.ruiz@email.com',
    phone: '+34 667 890 123',
    enrollmentDate: '2024-02-01',
    courses: [],
    attendance: 0,
    averageGrade: 0,
    status: 'pending',
  },
];

const enrollmentByMonth = [
  { month: 'Sep', nuevos: 45, graduados: 12 },
  { month: 'Oct', nuevos: 32, graduados: 8 },
  { month: 'Nov', nuevos: 28, graduados: 15 },
  { month: 'Dic', nuevos: 15, graduados: 20 },
  { month: 'Ene', nuevos: 38, graduados: 5 },
  { month: 'Feb', nuevos: 22, graduados: 10 },
];

const attendanceByWeek = [
  { week: 'S1', asistencia: 94 },
  { week: 'S2', asistencia: 92 },
  { week: 'S3', asistencia: 96 },
  { week: 'S4', asistencia: 91 },
  { week: 'S5', asistencia: 95 },
  { week: 'S6', asistencia: 93 },
];

const statusDistribution = [
  { name: 'Activos', value: 4, color: '#10b981' },
  { name: 'Graduados', value: 1, color: '#8b5cf6' },
  { name: 'Pendientes', value: 1, color: '#f59e0b' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Activo</Badge>;
    case 'inactive':
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Inactivo</Badge>;
    case 'graduated':
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Graduado</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendiente</Badge>;
    default:
      return null;
  }
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const getAttendanceColor = (attendance: number) => {
  if (attendance >= 90) return 'text-emerald-400';
  if (attendance >= 75) return 'text-amber-400';
  return 'text-red-400';
};

const getGradeColor = (grade: number) => {
  if (grade >= 8) return 'text-emerald-400';
  if (grade >= 6) return 'text-amber-400';
  return 'text-red-400';
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const EducationStudentsModule: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('students');

  const filteredStudents = students.filter(student => {
    const matchesFilter = filter === 'all' || student.status === filter;
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Total Alumnos', value: students.length, icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { label: 'Activos', value: students.filter(s => s.status === 'active').length, icon: UserCheck, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    { label: 'Graduados', value: students.filter(s => s.status === 'graduated').length, icon: GraduationCap, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { label: 'Asistencia Media', value: '91%', icon: TrendingUp, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            Gestión de Alumnos
          </h1>
          <p className="text-slate-400 mt-1">Administración de estudiantes y expedientes académicos</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Alumno
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
          <TabsTrigger value="students">Alumnos</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="attendance">Asistencia</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre, email o ID..."
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
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="graduated">Graduados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Students Grid */}
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredStudents.map((student) => (
              <motion.div key={student.id} variants={itemVariants}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500">
                          <AvatarFallback className="text-white font-semibold">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-white font-semibold">{student.name}</h3>
                          <p className="text-xs text-slate-500">{student.id}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem className="text-slate-300">
                            <Eye className="w-4 h-4 mr-2" /> Ver Expediente
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300">
                            <Edit className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300">
                            <FileText className="w-4 h-4 mr-2" /> Generar Certificado
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone className="w-4 h-4" />
                        {student.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-4 h-4" />
                        Matrícula: {student.enrollmentDate}
                      </div>
                    </div>

                    {student.courses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {student.courses.map((course) => (
                          <Badge key={course} variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {course}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <div className="text-center">
                        <p className={`text-lg font-bold ${getAttendanceColor(student.attendance)}`}>
                          {student.attendance}%
                        </p>
                        <p className="text-xs text-slate-500">Asistencia</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-bold ${getGradeColor(student.averageGrade)}`}>
                          {student.averageGrade || '-'}
                        </p>
                        <p className="text-xs text-slate-500">Nota Media</p>
                      </div>
                      {getStatusBadge(student.status)}
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
                  Matriculaciones por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={enrollmentByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="nuevos" fill="#3b82f6" name="Nuevos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="graduados" fill="#8b5cf6" name="Graduados" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Distribución por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  {statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-400">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Asistencia Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[80, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="asistencia" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                    name="Asistencia %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {students.filter(s => s.status === 'active' && s.attendance < 80).map((student) => (
              <Card key={student.id} className="bg-slate-800/50 border-red-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10 bg-gradient-to-br from-red-500 to-amber-500">
                      <AvatarFallback className="text-white text-sm">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Asistencia</span>
                    <span className="text-lg font-bold text-red-400">{student.attendance}%</span>
                  </div>
                  <Progress value={student.attendance} className="h-2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationStudentsModule;
