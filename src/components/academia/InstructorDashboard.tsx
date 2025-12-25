/**
 * InstructorDashboard - Página de instructor con métricas
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  BarChart3,
  MessageSquare,
  Award,
  Eye,
  ThumbsUp,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// Types
interface CourseMetrics {
  id: string;
  title: string;
  thumbnail?: string;
  students: number;
  completionRate: number;
  avgRating: number;
  reviewsCount: number;
  revenue: number;
  viewsThisMonth: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface ReviewData {
  id: string;
  studentName: string;
  studentAvatar?: string;
  courseName: string;
  rating: number;
  content: string;
  date: string;
  helpful: number;
}

interface StudentActivity {
  id: string;
  studentName: string;
  studentAvatar?: string;
  action: string;
  courseName: string;
  timestamp: string;
}

interface InstructorStats {
  totalStudents: number;
  totalCourses: number;
  avgRating: number;
  totalReviews: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  totalHoursContent: number;
  completionRate: number;
}

interface InstructorDashboardProps {
  className?: string;
}

// Mock data generator
const generateMockData = () => {
  const stats: InstructorStats = {
    totalStudents: 2847,
    totalCourses: 12,
    avgRating: 4.7,
    totalReviews: 342,
    totalRevenue: 45680,
    thisMonthRevenue: 3240,
    totalHoursContent: 156,
    completionRate: 68,
  };

  const courses: CourseMetrics[] = [
    {
      id: '1',
      title: 'React Avanzado: Patrones y Buenas Prácticas',
      students: 856,
      completionRate: 72,
      avgRating: 4.8,
      reviewsCount: 124,
      revenue: 12540,
      viewsThisMonth: 2340,
      trend: 'up',
      trendPercentage: 15,
    },
    {
      id: '2',
      title: 'TypeScript desde Cero',
      students: 634,
      completionRate: 65,
      avgRating: 4.6,
      reviewsCount: 89,
      revenue: 8920,
      viewsThisMonth: 1560,
      trend: 'up',
      trendPercentage: 8,
    },
    {
      id: '3',
      title: 'Node.js: APIs RESTful',
      students: 521,
      completionRate: 58,
      avgRating: 4.5,
      reviewsCount: 67,
      revenue: 7340,
      viewsThisMonth: 980,
      trend: 'down',
      trendPercentage: 3,
    },
    {
      id: '4',
      title: 'Testing con Jest y React Testing Library',
      students: 412,
      completionRate: 71,
      avgRating: 4.9,
      reviewsCount: 45,
      revenue: 5680,
      viewsThisMonth: 1120,
      trend: 'up',
      trendPercentage: 22,
    },
  ];

  const reviews: ReviewData[] = [
    {
      id: '1',
      studentName: 'María García',
      studentAvatar: '',
      courseName: 'React Avanzado',
      rating: 5,
      content: 'Excelente curso, muy bien explicado. Los ejemplos prácticos son muy útiles.',
      date: '2024-01-15',
      helpful: 12,
    },
    {
      id: '2',
      studentName: 'Carlos López',
      courseName: 'TypeScript desde Cero',
      rating: 4,
      content: 'Buen contenido, aunque me gustaría más ejercicios prácticos.',
      date: '2024-01-14',
      helpful: 8,
    },
    {
      id: '3',
      studentName: 'Ana Martínez',
      courseName: 'Node.js: APIs RESTful',
      rating: 5,
      content: 'Increíble instructor, explica de manera clara y concisa.',
      date: '2024-01-13',
      helpful: 15,
    },
  ];

  const activities: StudentActivity[] = [
    {
      id: '1',
      studentName: 'Pedro Sánchez',
      action: 'completó el módulo 3',
      courseName: 'React Avanzado',
      timestamp: 'Hace 5 min',
    },
    {
      id: '2',
      studentName: 'Laura Fernández',
      action: 'se inscribió en',
      courseName: 'TypeScript desde Cero',
      timestamp: 'Hace 12 min',
    },
    {
      id: '3',
      studentName: 'Diego Torres',
      action: 'dejó una reseña en',
      courseName: 'Node.js APIs',
      timestamp: 'Hace 25 min',
    },
    {
      id: '4',
      studentName: 'Carmen Ruiz',
      action: 'obtuvo certificado en',
      courseName: 'Testing con Jest',
      timestamp: 'Hace 1 hora',
    },
  ];

  return { stats, courses, reviews, activities };
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subValue, trend, trendValue, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, translateY: -2 }}
    className={cn(
      "p-4 rounded-xl bg-gradient-to-br border transition-shadow hover:shadow-lg",
      color
    )}
  >
    <div className="flex items-start justify-between">
      <div className="p-2 rounded-lg bg-white/10">
        {icon}
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
          trend === 'up' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
        )}>
          {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {trendValue}
        </div>
      )}
    </div>
    <div className="mt-3">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
      {subValue && <p className="text-xs text-white/40 mt-1">{subValue}</p>}
    </div>
  </motion.div>
);

// Course Row Component
const CourseRow: React.FC<{ course: CourseMetrics; index: number }> = ({ course, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
  >
    <div className="w-16 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
      <BookOpen className="w-5 h-5 text-primary" />
    </div>
    
    <div className="flex-1 min-w-0">
      <p className="font-medium text-slate-200 truncate">{course.title}</p>
      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" /> {course.students}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400" /> {course.avgRating}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" /> {course.viewsThisMonth}
        </span>
      </div>
    </div>

    <div className="text-right">
      <p className="text-sm font-medium text-green-400">${course.revenue.toLocaleString()}</p>
      <div className={cn(
        "flex items-center gap-1 text-xs mt-1",
        course.trend === 'up' ? "text-green-400" : "text-red-400"
      )}>
        {course.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {course.trendPercentage}%
      </div>
    </div>

    <div className="w-24">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>Completado</span>
        <span>{course.completionRate}%</span>
      </div>
      <Progress value={course.completionRate} className="h-1.5" />
    </div>
  </motion.div>
);

// Review Card Component
const ReviewCard: React.FC<{ review: ReviewData }> = ({ review }) => (
  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
    <div className="flex items-start gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={review.studentAvatar} />
        <AvatarFallback className="bg-slate-700">{review.studentName[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-200">{review.studentName}</p>
            <p className="text-xs text-slate-500">{review.courseName}</p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"
                )}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-2">{review.content}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span>{new Date(review.date).toLocaleDateString('es-ES')}</span>
          <button className="flex items-center gap-1 hover:text-slate-300 transition-colors">
            <ThumbsUp className="w-3 h-3" /> {review.helpful} útil
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Activity Item Component
const ActivityItem: React.FC<{ activity: StudentActivity }> = ({ activity }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
    <Avatar className="h-8 w-8">
      <AvatarImage src={activity.studentAvatar} />
      <AvatarFallback className="bg-slate-700 text-xs">{activity.studentName[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-300">
        <span className="font-medium">{activity.studentName}</span>{' '}
        <span className="text-slate-400">{activity.action}</span>{' '}
        <span className="text-primary">{activity.courseName}</span>
      </p>
    </div>
    <span className="text-xs text-slate-500 whitespace-nowrap">{activity.timestamp}</span>
  </div>
);

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [data, setData] = useState<ReturnType<typeof generateMockData> | null>(null);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setData(generateMockData());
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-pulse text-slate-400">Cargando métricas...</div>
      </div>
    );
  }

  const { stats, courses, reviews, activities } = data;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard de Instructor</h1>
          <p className="text-slate-400">Resumen de rendimiento de tus cursos</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <BookOpen className="w-4 h-4 mr-2" />
          Crear Nuevo Curso
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-white" />}
          label="Estudiantes Totales"
          value={stats.totalStudents.toLocaleString()}
          subValue="+156 este mes"
          trend="up"
          trendValue="12%"
          color="from-blue-600/80 to-blue-700/80 border-blue-500/30"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-white" />}
          label="Ingresos Totales"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          subValue={`$${stats.thisMonthRevenue.toLocaleString()} este mes`}
          trend="up"
          trendValue="8%"
          color="from-green-600/80 to-green-700/80 border-green-500/30"
        />
        <StatCard
          icon={<Star className="w-5 h-5 text-white" />}
          label="Valoración Media"
          value={stats.avgRating}
          subValue={`${stats.totalReviews} reseñas`}
          color="from-yellow-600/80 to-orange-600/80 border-yellow-500/30"
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-white" />}
          label="Tasa Completado"
          value={`${stats.completionRate}%`}
          subValue={`${stats.totalHoursContent}h de contenido`}
          trend="up"
          trendValue="5%"
          color="from-purple-600/80 to-purple-700/80 border-purple-500/30"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses Performance */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Rendimiento de Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courses.map((course, index) => (
                <CourseRow key={course.id} course={course} index={index} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-1">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Últimas Reseñas
            </CardTitle>
            <Button variant="ghost" size="sm">Ver todas</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorDashboard;
