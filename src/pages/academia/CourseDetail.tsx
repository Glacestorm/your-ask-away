/**
 * CourseDetail - Página de detalle de curso
 * Fase 2: Módulos completos con lecciones, tabs, reseñas
 */

import React, { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Clock, Users, Star, BookOpen, Award, 
  CheckCircle, ShoppingCart, MessageSquare, ChevronDown,
  Globe, Calendar, ArrowLeft, Lock, PlayCircle, FileText,
  Download, Share2, Heart, AlertCircle, Sparkles, Video,
  HelpCircle, Monitor, Smartphone, Trophy, Infinity, RefreshCw,
  ThumbsUp, ThumbsDown, MoreVertical, Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import StoreNavbar from '@/components/store/StoreNavbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

// Types
interface Lesson {
  id: string;
  title: string;
  titleEn: string;
  duration: number; // minutes
  type: 'video' | 'quiz' | 'exercise' | 'reading' | 'project';
  isPreview: boolean;
  isCompleted?: boolean;
}

interface Module {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  lessons: Lesson[];
}

interface Review {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  date: string;
  content: string;
  contentEn: string;
  helpful: number;
  notHelpful: number;
}

interface CourseData {
  id: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  description: string;
  descriptionEn: string;
  instructor: {
    name: string;
    title: string;
    titleEn: string;
    avatar: string;
    bio: string;
    bioEn: string;
    students: number;
    courses: number;
    rating: number;
  };
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  type: 'course' | 'certification' | 'webinar' | 'workshop';
  duration: number;
  students: number;
  rating: number;
  reviews: number;
  price: number;
  salePrice?: number;
  thumbnail: string;
  promoVideo?: string;
  language: string;
  lastUpdated: string;
  modules: Module[];
  learningObjectives: { es: string; en: string }[];
  requirements: { es: string; en: string }[];
  targetAudience: { es: string; en: string }[];
  reviewsList: Review[];
  features: string[];
}

// Mock course data - En producción vendrá de Supabase
const getCourseData = (courseId: string): CourseData => ({
  id: courseId,
  title: 'CRM Avanzado para Empresas',
  titleEn: 'Advanced CRM for Business',
  subtitle: 'Domina las estrategias de gestión de clientes con herramientas de última generación',
  subtitleEn: 'Master customer management strategies with cutting-edge tools',
  description: 'Este curso completo te llevará desde los conceptos fundamentales hasta las técnicas más avanzadas de gestión de relaciones con clientes. Aprenderás a configurar, personalizar y optimizar sistemas CRM para maximizar el valor de cada interacción con tus clientes.',
  descriptionEn: 'This comprehensive course will take you from fundamental concepts to the most advanced customer relationship management techniques. You will learn to configure, customize and optimize CRM systems to maximize the value of every customer interaction.',
  instructor: {
    name: 'María García',
    title: 'Experta en CRM & Customer Success',
    titleEn: 'CRM & Customer Success Expert',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    bio: '15 años de experiencia en implementación de CRM para empresas Fortune 500. Ha liderado proyectos de transformación digital en más de 50 organizaciones.',
    bioEn: '15 years of experience implementing CRM for Fortune 500 companies. Has led digital transformation projects in over 50 organizations.',
    students: 12500,
    courses: 8,
    rating: 4.9,
  },
  category: 'CRM',
  level: 'intermediate',
  type: 'course',
  duration: 12,
  students: 1250,
  rating: 4.8,
  reviews: 342,
  price: 199,
  salePrice: 149,
  thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
  promoVideo: 'https://example.com/promo.mp4',
  language: 'Español',
  lastUpdated: '2024-12-15',
  modules: [
    {
      id: 'mod-1',
      title: 'Introducción al CRM Moderno',
      titleEn: 'Introduction to Modern CRM',
      description: 'Fundamentos y evolución del CRM en la era digital',
      descriptionEn: 'Fundamentals and evolution of CRM in the digital era',
      lessons: [
        { id: 'l-1-1', title: '¿Qué es un CRM y por qué es importante?', titleEn: 'What is CRM and why is it important?', duration: 12, type: 'video', isPreview: true },
        { id: 'l-1-2', title: 'Historia y evolución del CRM', titleEn: 'History and evolution of CRM', duration: 15, type: 'video', isPreview: true },
        { id: 'l-1-3', title: 'Tipos de sistemas CRM', titleEn: 'Types of CRM systems', duration: 18, type: 'video', isPreview: false },
        { id: 'l-1-4', title: 'Lectura: Casos de éxito', titleEn: 'Reading: Success cases', duration: 10, type: 'reading', isPreview: false },
        { id: 'l-1-5', title: 'Quiz: Conceptos básicos', titleEn: 'Quiz: Basic concepts', duration: 8, type: 'quiz', isPreview: false },
      ],
    },
    {
      id: 'mod-2',
      title: 'Configuración y Personalización',
      titleEn: 'Configuration and Customization',
      description: 'Aprende a configurar tu CRM desde cero',
      descriptionEn: 'Learn to configure your CRM from scratch',
      lessons: [
        { id: 'l-2-1', title: 'Configuración inicial del sistema', titleEn: 'Initial system setup', duration: 20, type: 'video', isPreview: false },
        { id: 'l-2-2', title: 'Personalización de campos y entidades', titleEn: 'Customizing fields and entities', duration: 25, type: 'video', isPreview: false },
        { id: 'l-2-3', title: 'Ejercicio práctico: Tu primer pipeline', titleEn: 'Hands-on: Your first pipeline', duration: 30, type: 'exercise', isPreview: false },
        { id: 'l-2-4', title: 'Importación de datos existentes', titleEn: 'Importing existing data', duration: 18, type: 'video', isPreview: false },
        { id: 'l-2-5', title: 'Gestión de usuarios y permisos', titleEn: 'User and permission management', duration: 22, type: 'video', isPreview: false },
        { id: 'l-2-6', title: 'Quiz: Configuración avanzada', titleEn: 'Quiz: Advanced configuration', duration: 10, type: 'quiz', isPreview: false },
      ],
    },
    {
      id: 'mod-3',
      title: 'Automatización de Procesos',
      titleEn: 'Process Automation',
      description: 'Automatiza tareas repetitivas y mejora la productividad',
      descriptionEn: 'Automate repetitive tasks and improve productivity',
      lessons: [
        { id: 'l-3-1', title: 'Introducción a la automatización', titleEn: 'Introduction to automation', duration: 15, type: 'video', isPreview: false },
        { id: 'l-3-2', title: 'Workflows y reglas de negocio', titleEn: 'Workflows and business rules', duration: 28, type: 'video', isPreview: false },
        { id: 'l-3-3', title: 'Automatización de emails', titleEn: 'Email automation', duration: 22, type: 'video', isPreview: false },
        { id: 'l-3-4', title: 'Triggers y acciones avanzadas', titleEn: 'Advanced triggers and actions', duration: 25, type: 'video', isPreview: false },
        { id: 'l-3-5', title: 'Proyecto: Flujo de ventas automatizado', titleEn: 'Project: Automated sales flow', duration: 45, type: 'project', isPreview: false },
        { id: 'l-3-6', title: 'Mejores prácticas de automatización', titleEn: 'Automation best practices', duration: 15, type: 'reading', isPreview: false },
      ],
    },
    {
      id: 'mod-4',
      title: 'Análisis y Reportes',
      titleEn: 'Analytics and Reports',
      description: 'Toma decisiones basadas en datos con reportes avanzados',
      descriptionEn: 'Make data-driven decisions with advanced reports',
      lessons: [
        { id: 'l-4-1', title: 'Dashboard y métricas clave', titleEn: 'Dashboard and key metrics', duration: 20, type: 'video', isPreview: false },
        { id: 'l-4-2', title: 'Creación de reportes personalizados', titleEn: 'Creating custom reports', duration: 25, type: 'video', isPreview: false },
        { id: 'l-4-3', title: 'Análisis de pipeline de ventas', titleEn: 'Sales pipeline analysis', duration: 22, type: 'video', isPreview: false },
        { id: 'l-4-4', title: 'Ejercicio: Tu dashboard ejecutivo', titleEn: 'Exercise: Your executive dashboard', duration: 35, type: 'exercise', isPreview: false },
        { id: 'l-4-5', title: 'Forecasting y predicción', titleEn: 'Forecasting and prediction', duration: 18, type: 'video', isPreview: false },
      ],
    },
    {
      id: 'mod-5',
      title: 'Integración con IA',
      titleEn: 'AI Integration',
      description: 'Potencia tu CRM con inteligencia artificial',
      descriptionEn: 'Power your CRM with artificial intelligence',
      lessons: [
        { id: 'l-5-1', title: 'IA en el CRM: Panorama actual', titleEn: 'AI in CRM: Current landscape', duration: 18, type: 'video', isPreview: false },
        { id: 'l-5-2', title: 'Lead scoring con machine learning', titleEn: 'Lead scoring with machine learning', duration: 25, type: 'video', isPreview: false },
        { id: 'l-5-3', title: 'Chatbots y asistentes virtuales', titleEn: 'Chatbots and virtual assistants', duration: 22, type: 'video', isPreview: false },
        { id: 'l-5-4', title: 'Análisis predictivo de ventas', titleEn: 'Predictive sales analysis', duration: 20, type: 'video', isPreview: false },
        { id: 'l-5-5', title: 'Proyecto final: CRM inteligente', titleEn: 'Final project: Intelligent CRM', duration: 60, type: 'project', isPreview: false },
        { id: 'l-5-6', title: 'Examen final de certificación', titleEn: 'Final certification exam', duration: 30, type: 'quiz', isPreview: false },
      ],
    },
  ],
  learningObjectives: [
    { es: 'Dominar las funcionalidades avanzadas del CRM', en: 'Master advanced CRM features' },
    { es: 'Automatizar procesos de ventas y marketing', en: 'Automate sales and marketing processes' },
    { es: 'Crear dashboards y reportes personalizados', en: 'Create custom dashboards and reports' },
    { es: 'Integrar IA para predicción de ventas', en: 'Integrate AI for sales prediction' },
    { es: 'Optimizar el customer journey completo', en: 'Optimize the complete customer journey' },
    { es: 'Gestionar equipos de ventas con métricas', en: 'Manage sales teams with metrics' },
  ],
  requirements: [
    { es: 'Conocimientos básicos de ventas y marketing', en: 'Basic sales and marketing knowledge' },
    { es: 'Familiaridad con herramientas digitales', en: 'Familiarity with digital tools' },
    { es: 'Ordenador con conexión a internet', en: 'Computer with internet connection' },
  ],
  targetAudience: [
    { es: 'Gerentes de ventas y marketing', en: 'Sales and marketing managers' },
    { es: 'Profesionales de customer success', en: 'Customer success professionals' },
    { es: 'Emprendedores y dueños de negocio', en: 'Entrepreneurs and business owners' },
    { es: 'Consultores de transformación digital', en: 'Digital transformation consultants' },
  ],
  reviewsList: [
    {
      id: 'r-1',
      user: { name: 'Carlos M.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
      rating: 5,
      date: '2024-12-10',
      content: 'Excelente curso. María explica todo de forma muy clara y los ejercicios prácticos son muy útiles. Recomendado 100%.',
      contentEn: 'Excellent course. María explains everything very clearly and the hands-on exercises are very useful. 100% recommended.',
      helpful: 45,
      notHelpful: 2,
    },
    {
      id: 'r-2',
      user: { name: 'Ana L.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
      rating: 5,
      date: '2024-12-05',
      content: 'El mejor curso de CRM que he tomado. El módulo de IA es increíble y el chatbot tutor me ayudó mucho con mis dudas.',
      contentEn: 'The best CRM course I have taken. The AI module is amazing and the tutor chatbot helped me a lot with my questions.',
      helpful: 38,
      notHelpful: 1,
    },
    {
      id: 'r-3',
      user: { name: 'Pedro S.' },
      rating: 4,
      date: '2024-11-28',
      content: 'Muy buen contenido aunque algunos videos podrían ser más cortos. El proyecto final es muy completo.',
      contentEn: 'Very good content although some videos could be shorter. The final project is very comprehensive.',
      helpful: 22,
      notHelpful: 5,
    },
    {
      id: 'r-4',
      user: { name: 'Laura T.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
      rating: 5,
      date: '2024-11-20',
      content: 'Implementé lo aprendido en mi empresa y los resultados fueron inmediatos. Vale cada euro invertido.',
      contentEn: 'I implemented what I learned in my company and the results were immediate. Worth every euro invested.',
      helpful: 56,
      notHelpful: 0,
    },
  ],
  features: ['lifetime', 'certificate', 'mobile', 'downloadable', 'ai-tutor', 'projects'],
});

const getLessonIcon = (type: string) => {
  switch (type) {
    case 'video': return PlayCircle;
    case 'quiz': return HelpCircle;
    case 'exercise': return FileText;
    case 'reading': return BookOpen;
    case 'project': return Trophy;
    default: return PlayCircle;
  }
};

const CourseDetail: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { addItem, isInCart } = useCart();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedModules, setExpandedModules] = useState<string[]>(['mod-1']);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const course = useMemo(() => getCourseData(courseId || 'default'), [courseId]);

  // Calculate totals
  const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const totalDuration = course.modules.reduce((acc, mod) => 
    acc + mod.lessons.reduce((a, l) => a + l.duration, 0), 0);
  const previewLessons = course.modules.reduce((acc, mod) => 
    acc + mod.lessons.filter(l => l.isPreview).length, 0);

  // Rating distribution
  const ratingDistribution = [
    { stars: 5, percent: 78 },
    { stars: 4, percent: 15 },
    { stars: 3, percent: 5 },
    { stars: 2, percent: 1 },
    { stars: 1, percent: 1 },
  ];

  const handleAddToCart = () => {
    addItem({
      moduleKey: `course-${course.id}`,
      moduleName: language === 'es' ? course.title : course.titleEn,
      price: course.salePrice || course.price,
      quantity: 1,
      licenseType: 'perpetual',
      category: 'academia',
    });
    toast.success(language === 'es' ? 'Curso añadido al carrito' : 'Course added to cart');
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted 
      ? (language === 'es' ? 'Eliminado de favoritos' : 'Removed from wishlist')
      : (language === 'es' ? 'Añadido a favoritos' : 'Added to wishlist')
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(language === 'es' ? 'Enlace copiado' : 'Link copied');
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      beginner: { es: 'Principiante', en: 'Beginner' },
      intermediate: { es: 'Intermedio', en: 'Intermediate' },
      advanced: { es: 'Avanzado', en: 'Advanced' },
      expert: { es: 'Experto', en: 'Expert' },
    };
    return labels[level]?.[language as 'es' | 'en'] || level;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <StoreNavbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-8 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container mx-auto px-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-slate-400 text-sm mb-6"
          >
            <Link to="/academia" className="hover:text-white transition-colors">Academia</Link>
            <span>/</span>
            <Link to="/academia/cursos" className="hover:text-white transition-colors">
              {language === 'es' ? 'Cursos' : 'Courses'}
            </Link>
            <span>/</span>
            <span className="text-white truncate max-w-[200px]">
              {language === 'es' ? course.title : course.titleEn}
            </span>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {course.category}
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {getLevelLabel(course.level)}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {language === 'es' ? course.title : course.titleEn}
              </h1>

              <p className="text-lg text-slate-300 mb-6">
                {language === 'es' ? course.subtitle : course.subtitleEn}
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
                <div className="flex items-center gap-1">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold ml-1">{course.rating}</span>
                  </div>
                  <span className="text-slate-400">({course.reviews.toLocaleString()} {language === 'es' ? 'reseñas' : 'reviews'})</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Users className="w-4 h-4" />
                  <span>{course.students.toLocaleString()} {language === 'es' ? 'estudiantes' : 'students'}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(totalDuration)}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Globe className="w-4 h-4" />
                  <span>{course.language}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <RefreshCw className="w-4 h-4" />
                  <span>{language === 'es' ? 'Actualizado' : 'Updated'} {new Date(course.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 ring-2 ring-primary/50">
                  <AvatarImage src={course.instructor.avatar} />
                  <AvatarFallback>{course.instructor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{course.instructor.name}</p>
                  <p className="text-sm text-slate-400">
                    {language === 'es' ? course.instructor.title : course.instructor.titleEn}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Preview Image - Mobile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:hidden relative aspect-video rounded-xl overflow-hidden group"
            >
              <img
                src={course.thumbnail}
                alt={language === 'es' ? course.title : course.titleEn}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Button size="lg" className="gap-2 bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30">
                  <Play className="w-6 h-6 fill-current" />
                  {language === 'es' ? 'Ver preview' : 'Watch preview'}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start bg-slate-800/50 border border-slate-700 h-auto p-1 flex-wrap">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary">
                  {language === 'es' ? 'Descripción' : 'Overview'}
                </TabsTrigger>
                <TabsTrigger value="curriculum" className="data-[state=active]:bg-primary">
                  {language === 'es' ? 'Contenido' : 'Curriculum'}
                </TabsTrigger>
                <TabsTrigger value="instructor" className="data-[state=active]:bg-primary">
                  {language === 'es' ? 'Instructor' : 'Instructor'}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-primary">
                  {language === 'es' ? 'Reseñas' : 'Reviews'}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Description */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <p className="text-slate-300 leading-relaxed">
                      {language === 'es' ? course.description : course.descriptionEn}
                    </p>
                  </CardContent>
                </Card>

                {/* Learning Objectives */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      {language === 'es' ? 'Lo que aprenderás' : 'What you will learn'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                      {course.learningObjectives.map((objective, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-slate-300">{objective[language as 'es' | 'en']}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      {language === 'es' ? 'Requisitos' : 'Requirements'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {course.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-2 text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          {req[language as 'es' | 'en']}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Target Audience */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      {language === 'es' ? '¿Para quién es este curso?' : 'Who is this course for?'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {course.targetAudience.map((audience, index) => (
                        <li key={index} className="flex items-center gap-2 text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          {audience[language as 'es' | 'en']}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* AI Tutor Feature */}
                <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {language === 'es' ? 'Tutor IA Especializado 24/7' : 'Specialized AI Tutor 24/7'}
                        </h3>
                        <p className="text-slate-300">
                          {language === 'es' 
                            ? 'Este curso incluye un chatbot de IA entrenado específicamente en el contenido del curso. Resuelve tus dudas al instante con respuestas precisas y contextualizadas.'
                            : 'This course includes an AI chatbot trained specifically on course content. Get your questions answered instantly with precise and contextualized responses.'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Curriculum Tab */}
              <TabsContent value="curriculum" className="mt-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        {language === 'es' ? 'Contenido del curso' : 'Course content'}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setExpandedModules(
                          expandedModules.length === course.modules.length 
                            ? [] 
                            : course.modules.map(m => m.id)
                        )}
                        className="text-slate-400 hover:text-white"
                      >
                        {expandedModules.length === course.modules.length 
                          ? (language === 'es' ? 'Colapsar todo' : 'Collapse all')
                          : (language === 'es' ? 'Expandir todo' : 'Expand all')}
                      </Button>
                    </div>
                    <p className="text-sm text-slate-400">
                      {course.modules.length} {language === 'es' ? 'módulos' : 'modules'} • 
                      {totalLessons} {language === 'es' ? 'lecciones' : 'lessons'} • 
                      {formatDuration(totalDuration)} {language === 'es' ? 'de contenido' : 'of content'}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Accordion 
                      type="multiple" 
                      value={expandedModules}
                      onValueChange={setExpandedModules}
                      className="space-y-3"
                    >
                      {course.modules.map((module, moduleIndex) => {
                        const moduleDuration = module.lessons.reduce((a, l) => a + l.duration, 0);
                        const previewCount = module.lessons.filter(l => l.isPreview).length;
                        
                        return (
                          <AccordionItem 
                            key={module.id} 
                            value={module.id}
                            className="border border-slate-700 rounded-xl overflow-hidden data-[state=open]:bg-slate-800/50"
                          >
                            <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-slate-700/30">
                              <div className="flex items-center gap-4 text-left w-full pr-4">
                                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold shrink-0">
                                  {moduleIndex + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-white">
                                    {language === 'es' ? module.title : module.titleEn}
                                  </p>
                                  <p className="text-sm text-slate-400 mt-0.5">
                                    {module.lessons.length} {language === 'es' ? 'lecciones' : 'lessons'} • {formatDuration(moduleDuration)}
                                    {previewCount > 0 && (
                                      <span className="ml-2 text-primary">
                                        • {previewCount} preview
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <p className="text-sm text-slate-400 mb-4 pl-14">
                                {language === 'es' ? module.description : module.descriptionEn}
                              </p>
                              <div className="space-y-1 pl-14">
                                {module.lessons.map((lesson, lessonIndex) => {
                                  const LessonIcon = getLessonIcon(lesson.type);
                                  return (
                                    <div 
                                      key={lesson.id}
                                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                        lesson.isPreview 
                                          ? 'hover:bg-primary/10 cursor-pointer' 
                                          : 'opacity-80'
                                      }`}
                                    >
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        lesson.isPreview 
                                          ? 'bg-primary/20 text-primary' 
                                          : 'bg-slate-700 text-slate-400'
                                      }`}>
                                        <LessonIcon className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${lesson.isPreview ? 'text-white' : 'text-slate-300'}`}>
                                          {language === 'es' ? lesson.title : lesson.titleEn}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                                        <span>{formatDuration(lesson.duration)}</span>
                                        {lesson.isPreview ? (
                                          <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                                            Preview
                                          </Badge>
                                        ) : (
                                          <Lock className="w-3.5 h-3.5" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Instructor Tab */}
              <TabsContent value="instructor" className="mt-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <Avatar className="w-28 h-28 ring-4 ring-primary/30 shrink-0">
                        <AvatarImage src={course.instructor.avatar} />
                        <AvatarFallback className="text-2xl">{course.instructor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">{course.instructor.name}</h3>
                        <p className="text-primary mb-4">
                          {language === 'es' ? course.instructor.title : course.instructor.titleEn}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span>{course.instructor.rating} {language === 'es' ? 'valoración' : 'rating'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>{course.instructor.students.toLocaleString()} {language === 'es' ? 'estudiantes' : 'students'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <span>{course.instructor.courses} {language === 'es' ? 'cursos' : 'courses'}</span>
                          </div>
                        </div>

                        <p className="text-slate-300 leading-relaxed">
                          {language === 'es' ? course.instructor.bio : course.instructor.bioEn}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-6">
                {/* Rating Summary */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Overall Rating */}
                      <div className="text-center md:text-left shrink-0">
                        <div className="text-5xl font-bold text-amber-400 mb-2">{course.rating}</div>
                        <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              className={`w-5 h-5 ${star <= Math.round(course.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} 
                            />
                          ))}
                        </div>
                        <p className="text-sm text-slate-400">{course.reviews} {language === 'es' ? 'reseñas' : 'reviews'}</p>
                      </div>

                      {/* Rating Distribution */}
                      <div className="flex-1 space-y-2">
                        {ratingDistribution.map(({ stars, percent }) => (
                          <div key={stars} className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-20 shrink-0">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm text-slate-300">{stars}</span>
                            </div>
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-400 w-12 text-right">{percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                <div className="space-y-4">
                  {course.reviewsList.map(review => (
                    <Card key={review.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={review.user.avatar} />
                            <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white">{review.user.name}</span>
                              <span className="text-xs text-slate-400">
                                {new Date(review.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star} 
                                  className={`w-4 h-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} 
                                />
                              ))}
                            </div>
                            <p className="text-slate-300 mb-3">
                              {language === 'es' ? review.content : review.contentEn}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{review.helpful}</span>
                              </button>
                              <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                                <ThumbsDown className="w-4 h-4" />
                                <span>{review.notHelpful}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Purchase Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-28"
            >
              <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm overflow-hidden">
                {/* Preview Image - Desktop */}
                <div className="hidden lg:block relative aspect-video">
                  <img
                    src={course.thumbnail}
                    alt={language === 'es' ? course.title : course.titleEn}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Button size="lg" variant="ghost" className="gap-2 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20">
                      <Play className="w-6 h-6 fill-current" />
                      {language === 'es' ? 'Preview' : 'Preview'}
                    </Button>
                  </div>
                </div>

                <CardContent className="p-6 space-y-5">
                  {/* Price */}
                  <div>
                    {course.salePrice ? (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-white">€{course.salePrice}</span>
                        <span className="text-lg text-slate-400 line-through">€{course.price}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                          -{Math.round((1 - course.salePrice / course.price) * 100)}%
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-white">€{course.price}</span>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    {isInCart(`course-${course.id}`) ? (
                      <Button className="w-full" size="lg" asChild>
                        <Link to="/store/checkout">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {language === 'es' ? 'Ir al carrito' : 'Go to cart'}
                        </Link>
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90" 
                        size="lg"
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {language === 'es' ? 'Añadir al carrito' : 'Add to cart'}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full border-slate-600 text-white hover:bg-slate-700" 
                      size="lg"
                    >
                      {language === 'es' ? 'Comprar ahora' : 'Buy now'}
                    </Button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleWishlist}
                            className={`flex-1 border-slate-600 ${isWishlisted ? 'text-rose-400 border-rose-400/50' : 'text-slate-400'}`}
                          >
                            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {language === 'es' ? 'Añadir a favoritos' : 'Add to wishlist'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleShare}
                            className="flex-1 border-slate-600 text-slate-400"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {language === 'es' ? 'Compartir' : 'Share'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Course includes */}
                  <div>
                    <h4 className="font-medium text-white mb-3">
                      {language === 'es' ? 'Este curso incluye:' : 'This course includes:'}
                    </h4>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center gap-3 text-slate-300">
                        <Video className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{formatDuration(totalDuration)} {language === 'es' ? 'de video' : 'of video'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300">
                        <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{totalLessons} {language === 'es' ? 'lecciones' : 'lessons'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300">
                        <Download className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{language === 'es' ? 'Recursos descargables' : 'Downloadable resources'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300">
                        <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{language === 'es' ? 'Tutor IA 24/7' : 'AI Tutor 24/7'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300">
                        <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{language === 'es' ? 'Acceso móvil y TV' : 'Mobile and TV access'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300">
                        <Award className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{language === 'es' ? 'Certificado de finalización' : 'Certificate of completion'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300">
                        <Infinity className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{language === 'es' ? 'Acceso de por vida' : 'Lifetime access'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetail;
