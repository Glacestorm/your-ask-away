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
  MapPin,
  Clock,
  CheckCircle2,
  Heart,
  Star,
  MoreVertical,
  Briefcase
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

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  hoursThisMonth: number;
  totalHours: number;
  skills: string[];
  projects: string[];
  availability: string[];
  rating: number;
}

const volunteers: Volunteer[] = [
  {
    id: 'VOL-001',
    name: 'Elena Rodríguez',
    email: 'elena.rodriguez@email.com',
    phone: '+34 612 345 678',
    joinDate: '2022-03-15',
    status: 'active',
    hoursThisMonth: 24,
    totalHours: 456,
    skills: ['Docencia', 'Idiomas', 'Administración'],
    projects: ['Apoyo Escolar', 'Clases de Español'],
    availability: ['Lun', 'Mié', 'Vie'],
    rating: 4.9
  },
  {
    id: 'VOL-002',
    name: 'Miguel Fernández',
    email: 'miguel.fernandez@email.com',
    phone: '+34 623 456 789',
    joinDate: '2023-01-10',
    status: 'active',
    hoursThisMonth: 16,
    totalHours: 180,
    skills: ['Informática', 'Redes Sociales'],
    projects: ['Digitalización', 'Web ONG'],
    availability: ['Mar', 'Jue', 'Sáb'],
    rating: 4.7
  },
  {
    id: 'VOL-003',
    name: 'Carmen López',
    email: 'carmen.lopez@email.com',
    phone: '+34 634 567 890',
    joinDate: '2021-09-01',
    status: 'active',
    hoursThisMonth: 32,
    totalHours: 720,
    skills: ['Coordinación', 'Eventos', 'Recaudación'],
    projects: ['Gala Benéfica', 'Mercadillo Solidario'],
    availability: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    rating: 5.0
  },
  {
    id: 'VOL-004',
    name: 'Pablo García',
    email: 'pablo.garcia@email.com',
    phone: '+34 645 678 901',
    joinDate: '2023-06-20',
    status: 'on_leave',
    hoursThisMonth: 0,
    totalHours: 85,
    skills: ['Transporte', 'Logística'],
    projects: ['Banco de Alimentos'],
    availability: [],
    rating: 4.5
  },
  {
    id: 'VOL-005',
    name: 'Isabel Martín',
    email: 'isabel.martin@email.com',
    phone: '+34 656 789 012',
    joinDate: '2024-01-05',
    status: 'active',
    hoursThisMonth: 8,
    totalHours: 24,
    skills: ['Comunicación', 'Fotografía'],
    projects: ['Redes Sociales'],
    availability: ['Sáb', 'Dom'],
    rating: 4.8
  },
];

const projects = [
  { id: 1, name: 'Apoyo Escolar', volunteers: 12, hoursNeeded: 40, hoursCompleted: 32 },
  { id: 2, name: 'Banco de Alimentos', volunteers: 8, hoursNeeded: 60, hoursCompleted: 45 },
  { id: 3, name: 'Gala Benéfica 2024', volunteers: 15, hoursNeeded: 80, hoursCompleted: 20 },
  { id: 4, name: 'Clases de Español', volunteers: 6, hoursNeeded: 24, hoursCompleted: 18 },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Activo</Badge>;
    case 'inactive':
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Inactivo</Badge>;
    case 'on_leave':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Baja temporal</Badge>;
    default:
      return null;
  }
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export const EducationVolunteersModule: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesFilter = filter === 'all' || volunteer.status === filter;
    const matchesSearch = 
      volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const totalHoursThisMonth = volunteers.reduce((sum, v) => sum + v.hoursThisMonth, 0);
  const activeVolunteers = volunteers.filter(v => v.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-400" />
            Gestión de Voluntarios
          </h1>
          <p className="text-slate-400 mt-1">Coordinación de voluntariado y proyectos sociales</p>
        </div>
        <Button className="bg-pink-600 hover:bg-pink-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Voluntario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-pink-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{volunteers.length}</p>
            <p className="text-sm text-slate-400">Total Voluntarios</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-400">{activeVolunteers}</p>
            <p className="text-sm text-slate-400">Activos</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-400">{totalHoursThisMonth}h</p>
            <p className="text-sm text-slate-400">Horas Este Mes</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Briefcase className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-400">{projects.length}</p>
            <p className="text-sm text-slate-400">Proyectos Activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            Proyectos en Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h4 className="text-white font-medium mb-2">{project.name}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                  <Users className="w-4 h-4" />
                  {project.volunteers} voluntarios
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Horas</span>
                    <span className="text-white">{project.hoursCompleted}/{project.hoursNeeded}h</span>
                  </div>
                  <Progress value={(project.hoursCompleted / project.hoursNeeded) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, email o habilidad..."
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
              <SelectItem value="on_leave">Baja temporal</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Volunteers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVolunteers.map((volunteer, index) => (
          <motion.div
            key={volunteer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500">
                      <AvatarFallback className="text-white font-semibold">
                        {getInitials(volunteer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-white font-semibold">{volunteer.name}</h3>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-sm">{volunteer.rating}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(volunteer.status)}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Mail className="w-4 h-4" />
                    {volunteer.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    Desde: {volunteer.joinDate}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Habilidades</p>
                  <div className="flex flex-wrap gap-1">
                    {volunteer.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs border-slate-600 text-slate-300">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Disponibilidad</p>
                  <div className="flex gap-1">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                      <div
                        key={day}
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs ${
                          volunteer.availability.includes(day) 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-slate-700/50 text-slate-600'
                        }`}
                      >
                        {day[0]}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-400">{volunteer.hoursThisMonth}h</p>
                    <p className="text-xs text-slate-500">Este mes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-400">{volunteer.totalHours}h</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{volunteer.projects.length}</p>
                    <p className="text-xs text-slate-500">Proyectos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EducationVolunteersModule;
