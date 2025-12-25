/**
 * AcademiaAdminPage - Panel de administración de la Academia
 * Permite gestionar cursos, usuarios, contenido y analytics
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  BarChart3, 
  Settings,
  Award,
  MessageSquare,
  Bell,
  Plus,
  FileText,
  TrendingUp,
  Calendar,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { GlobalNavHeader } from '@/components/GlobalNavHeader';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminModule {
  id: string;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  color: string;
}

const adminModules: AdminModule[] = [
  {
    id: 'courses',
    title: 'Course Management',
    titleEs: 'Gestión de Cursos',
    description: 'Create, edit and manage courses',
    descriptionEs: 'Crear, editar y gestionar cursos',
    icon: BookOpen,
    href: '/academia/gestion-cursos',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'users',
    title: 'Students',
    titleEs: 'Estudiantes',
    description: 'Manage enrolled students',
    descriptionEs: 'Gestionar estudiantes matriculados',
    icon: Users,
    href: '/academia/analytics',
    badge: '1,234',
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    titleEs: 'Analytics',
    description: 'View performance metrics',
    descriptionEs: 'Ver métricas de rendimiento',
    icon: BarChart3,
    href: '/academia/analytics',
    color: 'from-emerald-500 to-green-500'
  },
  {
    id: 'certificates',
    title: 'Certificates',
    titleEs: 'Certificados',
    description: 'Manage issued certificates',
    descriptionEs: 'Gestionar certificados emitidos',
    icon: Award,
    href: '/academia/verificar',
    badge: '456',
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'community',
    title: 'Community',
    titleEs: 'Comunidad',
    description: 'Moderate discussions',
    descriptionEs: 'Moderar discusiones',
    icon: MessageSquare,
    href: '/academia/comunidad',
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    titleEs: 'Notificaciones',
    description: 'Send announcements',
    descriptionEs: 'Enviar anuncios',
    icon: Bell,
    href: '/academia/notificaciones',
    color: 'from-red-500 to-orange-500'
  },
];

const quickStats = [
  { label: 'Total Students', labelEs: 'Estudiantes Totales', value: '1,234', change: '+12%', up: true },
  { label: 'Active Courses', labelEs: 'Cursos Activos', value: '24', change: '+3', up: true },
  { label: 'Completion Rate', labelEs: 'Tasa de Finalización', value: '78%', change: '+5%', up: true },
  { label: 'Revenue', labelEs: 'Ingresos', value: '€45,600', change: '+18%', up: true },
];

const recentActivity = [
  { type: 'enrollment', user: 'Juan García', action: 'enrolled in', target: 'React Fundamentals', time: '5 min ago' },
  { type: 'completion', user: 'María López', action: 'completed', target: 'JavaScript Basics', time: '15 min ago' },
  { type: 'certificate', user: 'Carlos Ruiz', action: 'received certificate for', target: 'Node.js Master', time: '1 hour ago' },
  { type: 'review', user: 'Ana Martín', action: 'left a 5-star review on', target: 'Python for Data', time: '2 hours ago' },
];

interface AcademiaAdminPageProps {
  embedded?: boolean;
}

const AcademiaAdminPage: React.FC<AcademiaAdminPageProps> = ({ embedded = false }) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  const content = (
    <div className={embedded ? '' : 'container mx-auto px-4 py-8 pt-20'}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/admin" className="hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              {language === 'es' ? 'Administración' : 'Admin'}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Academia</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {language === 'es' ? 'Administración Academia' : 'Academia Administration'}
                </h1>
                <p className="text-muted-foreground">
                  {language === 'es' 
                    ? 'Gestiona cursos, estudiantes y contenido educativo' 
                    : 'Manage courses, students and educational content'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/academia">
                  {language === 'es' ? 'Ver Academia' : 'View Academia'}
                </Link>
              </Button>
              <Button asChild>
                <Link to="/academia/gestion-cursos" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {language === 'es' ? 'Nuevo Curso' : 'New Course'}
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {language === 'es' ? stat.labelEs : stat.label}
                  </p>
                  <Badge variant={stat.up ? 'default' : 'destructive'} className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              {language === 'es' ? 'Vista General' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="modules">
              {language === 'es' ? 'Módulos' : 'Modules'}
            </TabsTrigger>
            <TabsTrigger value="activity">
              {language === 'es' ? 'Actividad' : 'Activity'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Admin Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminModules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link to={module.href}>
                    <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color}`}>
                            <module.icon className="h-6 w-6 text-white" />
                          </div>
                          {module.badge && (
                            <Badge variant="secondary">{module.badge}</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {language === 'es' ? module.titleEs : module.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {language === 'es' ? module.descriptionEs : module.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {language === 'es' ? 'Rendimiento del Mes' : 'Monthly Performance'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{language === 'es' ? 'Nuevas matrículas' : 'New Enrollments'}</span>
                      <span className="font-medium">156 / 200</span>
                    </div>
                    <Progress value={78} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{language === 'es' ? 'Completados' : 'Completions'}</span>
                      <span className="font-medium">89 / 100</span>
                    </div>
                    <Progress value={89} className="bg-muted" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{language === 'es' ? 'Certificados emitidos' : 'Certificates Issued'}</span>
                      <span className="font-medium">67 / 80</span>
                    </div>
                    <Progress value={84} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {language === 'es' ? 'Próximos Eventos' : 'Upcoming Events'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">ENE</p>
                        <p className="text-lg font-bold">15</p>
                      </div>
                      <div>
                        <p className="font-medium">Webinar: React 19</p>
                        <p className="text-sm text-muted-foreground">10:00 AM</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">ENE</p>
                        <p className="text-lg font-bold">20</p>
                      </div>
                      <div>
                        <p className="font-medium">Workshop: AI Basics</p>
                        <p className="text-sm text-muted-foreground">2:00 PM</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="modules">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminModules.map((module) => (
                <Link key={module.id} to={module.href}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${module.color}`}>
                        <module.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {language === 'es' ? module.titleEs : module.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {language === 'es' ? module.descriptionEs : module.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'es' ? 'Actividad Reciente' : 'Recent Activity'}</CardTitle>
                <CardDescription>
                  {language === 'es' ? 'Últimas acciones en la plataforma' : 'Latest actions on the platform'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {activity.type === 'enrollment' && <Users className="h-5 w-5 text-primary" />}
                        {activity.type === 'completion' && <Award className="h-5 w-5 text-green-500" />}
                        {activity.type === 'certificate' && <FileText className="h-5 w-5 text-amber-500" />}
                        {activity.type === 'review' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>
                          {' '}{activity.action}{' '}
                          <span className="font-medium text-primary">{activity.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
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

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavHeader />
      {content}
    </div>
  );
};

export default AcademiaAdminPage;
