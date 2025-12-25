/**
 * AcademiaProfile - Página de perfil académico con logros y certificados
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Award,
  Trophy,
  BookOpen,
  Calendar,
  GraduationCap,
  Target,
  Clock,
  Play,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AchievementSystem } from '@/components/academia/AchievementSystem';
import { CertificateGenerator } from '@/components/academia/CertificateGenerator';
import { useTrainingCertificates, Certificate } from '@/hooks/useTrainingCertificates';
import { useTrainingEnrollments, Enrollment } from '@/hooks/useTrainingEnrollments';
import { useTrainingGamification } from '@/hooks/useTrainingGamification';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// Interface for CertificateGenerator component
interface CertificateDisplayData {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  studentName: string;
  courseName: string;
  courseDescription?: string;
  completionDate: string;
  issuedAt: string;
  score?: number;
  skills?: string[];
  organizationName?: string;
}

const AcademiaProfile: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { myCertificates, fetchMyCertificates, loading: loadingCerts } = useTrainingCertificates();
  const { enrollments, loading: loadingEnrollments, getStats } = useTrainingEnrollments();
  const { myStats, fetchLeaderboard } = useTrainingGamification();
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateDisplayData | null>(null);

  const stats = getStats();

  useEffect(() => {
    fetchMyCertificates();
    fetchLeaderboard(20);
  }, [fetchMyCertificates, fetchLeaderboard]);

  // Get course title helper
  const getCourseTitle = (item: { course?: { title?: { es?: string; en?: string } | string } }): string => {
    if (!item.course?.title) return 'Curso';
    if (typeof item.course.title === 'string') return item.course.title;
    return item.course.title.es || item.course.title.en || 'Curso';
  };

  // Transform certificate for CertificateGenerator
  const transformCertificate = (cert: Certificate & { course?: { title?: { es?: string; en?: string } | string; description?: { es?: string } | string } }): CertificateDisplayData => ({
    id: cert.id,
    certificateNumber: cert.certificate_number,
    verificationCode: cert.verification_code,
    studentName: user?.user_metadata?.full_name || 'Estudiante',
    courseName: getCourseTitle(cert),
    courseDescription: typeof cert.course?.description === 'string' 
      ? cert.course.description 
      : cert.course?.description?.es,
    completionDate: cert.issued_at,
    issuedAt: cert.issued_at,
    score: cert.score || undefined,
    skills: cert.skills_acquired || [],
    organizationName: 'Academia ObelixIA',
  });

  // Get status badge
  const getStatusBadge = (status: Enrollment['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completado</Badge>;
      case 'active':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">En progreso</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Expirado</Badge>;
      default:
        return <Badge variant="outline">Cancelado</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/academia" 
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{language === 'es' ? 'Volver a Academia' : 'Back to Academy'}</span>
            </Link>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="font-semibold text-white">
                {language === 'es' ? 'Mi Perfil Académico' : 'My Academic Profile'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* User Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-primary/25">
              {myStats?.level || 1}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {user?.user_metadata?.full_name || 'Estudiante'}
              </h1>
              <p className="text-slate-400 mb-2">{user?.email}</p>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline" className="border-primary/50 text-primary">
                  <Trophy className="w-3 h-3 mr-1" />
                  {myStats?.total_xp || 0} XP
                </Badge>
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                  <Award className="w-3 h-3 mr-1" />
                  {myCertificates.length} {language === 'es' ? 'Certificados' : 'Certificates'}
                </Badge>
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {stats.completed} {language === 'es' ? 'Cursos' : 'Courses'}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs defaultValue="achievements" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              {language === 'es' ? 'Logros' : 'Achievements'}
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <Award className="w-4 h-4" />
              {language === 'es' ? 'Certificados' : 'Certificates'}
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="w-4 h-4" />
              {language === 'es' ? 'Cursos' : 'Courses'}
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <AchievementSystem showLeaderboard={true} />
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Certificates List */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    {language === 'es' ? 'Mis Certificados' : 'My Certificates'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCerts ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : myCertificates.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">
                        {language === 'es' ? 'Aún no tienes certificados' : 'No certificates yet'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {language === 'es' 
                          ? 'Completa cursos para obtener certificados' 
                          : 'Complete courses to earn certificates'}
                      </p>
                      <Link to="/academia/cursos">
                        <Button variant="outline" className="mt-4">
                          <BookOpen className="w-4 h-4 mr-2" />
                          {language === 'es' ? 'Explorar cursos' : 'Explore courses'}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {myCertificates.map((cert) => {
                          const certWithCourse = cert as Certificate & { course?: { title?: { es?: string; en?: string } | string } };
                          return (
                          <motion.div
                            key={cert.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              "p-4 rounded-lg border cursor-pointer transition-all",
                              selectedCertificate?.id === cert.id
                                ? "bg-primary/10 border-primary/50"
                                : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                            )}
                            onClick={() => setSelectedCertificate(transformCertificate(certWithCourse))}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white truncate">
                                  {getCourseTitle(certWithCourse)}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(cert.issued_at).toLocaleDateString('es-ES')}
                                  </span>
                                  {cert.score && (
                                    <Badge variant="outline" className="h-4 text-[10px] border-green-500/50 text-green-400">
                                      {cert.score}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Certificate Preview */}
              <div>
                {selectedCertificate ? (
                  <CertificateGenerator
                    certificate={selectedCertificate}
                    onShare={(platform) => console.log('Shared on', platform)}
                  />
                ) : (
                  <Card className="bg-slate-900/50 border-slate-800 h-full flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">
                        {language === 'es' 
                          ? 'Selecciona un certificado para ver detalles' 
                          : 'Select a certificate to view details'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-slate-400">{language === 'es' ? 'Total cursos' : 'Total courses'}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.completed}</p>
                  <p className="text-xs text-slate-400">{language === 'es' ? 'Completados' : 'Completed'}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.totalTimeHours}h</p>
                  <p className="text-xs text-slate-400">{language === 'es' ? 'Tiempo total' : 'Total time'}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="w-5 h-5 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.avgProgress}%</p>
                  <p className="text-xs text-slate-400">{language === 'es' ? 'Progreso promedio' : 'Avg progress'}</p>
                </CardContent>
              </Card>
            </div>

            {/* Enrollments List */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  {language === 'es' ? 'Historial de Cursos' : 'Course History'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEnrollments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      {language === 'es' ? 'No tienes inscripciones aún' : 'No enrollments yet'}
                    </h3>
                    <p className="text-slate-400 mb-4">
                      {language === 'es' 
                        ? 'Explora nuestro catálogo de cursos' 
                        : 'Explore our course catalog'}
                    </p>
                    <Link to="/academia/cursos">
                      <Button>
                        <BookOpen className="w-4 h-4 mr-2" />
                        {language === 'es' ? 'Explorar cursos' : 'Explore courses'}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <motion.div
                          key={enrollment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all"
                        >
                          <div className="flex items-start gap-4">
                            {/* Thumbnail */}
                            <div className="w-24 h-16 rounded-lg bg-slate-700 overflow-hidden shrink-0">
                              {enrollment.course?.thumbnail_url ? (
                                <img 
                                  src={enrollment.course.thumbnail_url} 
                                  alt={getCourseTitle(enrollment)}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-6 h-6 text-slate-500" />
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-white truncate">
                                  {getCourseTitle(enrollment)}
                                </h4>
                                {getStatusBadge(enrollment.status)}
                              </div>
                              
                              {/* Progress bar */}
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                  <span>{language === 'es' ? 'Progreso' : 'Progress'}</span>
                                  <span>{enrollment.progress_percentage}%</span>
                                </div>
                                <Progress value={enrollment.progress_percentage} className="h-1.5" />
                              </div>
                              
                              {/* Meta info */}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(enrollment.created_at).toLocaleDateString('es-ES')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {Math.round(enrollment.time_spent_minutes / 60)}h {enrollment.time_spent_minutes % 60}m
                                </span>
                                {enrollment.certificate_issued && (
                                  <span className="flex items-center gap-1 text-yellow-400">
                                    <Award className="w-3 h-3" />
                                    {language === 'es' ? 'Certificado' : 'Certificate'}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Action */}
                            <Link to={`/academia/aprender/${enrollment.course_id}`}>
                              <Button variant="ghost" size="icon" className="shrink-0">
                                <Play className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AcademiaProfile;
