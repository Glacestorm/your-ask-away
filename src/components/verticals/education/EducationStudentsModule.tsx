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
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

export const EducationStudentsModule: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const filteredStudents = students.filter(student => {
    const matchesFilter = filter === 'all' || student.status === filter;
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Total Alumnos', value: students.length, color: 'text-white' },
    { label: 'Activos', value: students.filter(s => s.status === 'active').length, color: 'text-emerald-400' },
    { label: 'Graduados', value: students.filter(s => s.status === 'graduated').length, color: 'text-purple-400' },
    { label: 'Pendientes', value: students.filter(s => s.status === 'pending').length, color: 'text-amber-400' },
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

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
          <div className="flex border border-slate-600 rounded-lg overflow-hidden">
            <Button 
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className={viewMode === 'cards' ? 'bg-blue-600' : 'text-slate-400'}
            >
              Tarjetas
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-blue-600' : 'text-slate-400'}
            >
              Tabla
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {viewMode === 'cards' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
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

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Mail className="w-4 h-4" />
                      {student.email}
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
        </div>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Alumno</TableHead>
                  <TableHead className="text-slate-400">Contacto</TableHead>
                  <TableHead className="text-slate-400">Cursos</TableHead>
                  <TableHead className="text-slate-400 text-center">Asistencia</TableHead>
                  <TableHead className="text-slate-400 text-center">Nota Media</TableHead>
                  <TableHead className="text-slate-400">Estado</TableHead>
                  <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500">
                          <AvatarFallback className="text-white text-xs">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-slate-300 text-sm">{student.email}</p>
                      <p className="text-slate-500 text-xs">{student.phone}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.courses.slice(0, 2).map((course) => (
                          <Badge key={course} variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {course}
                          </Badge>
                        ))}
                        {student.courses.length > 2 && (
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            +{student.courses.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={`text-center font-medium ${getAttendanceColor(student.attendance)}`}>
                      {student.attendance}%
                    </TableCell>
                    <TableCell className={`text-center font-medium ${getGradeColor(student.averageGrade)}`}>
                      {student.averageGrade || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EducationStudentsModule;
