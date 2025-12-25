/**
 * CourseDetail - Página de detalle de curso
 * Fase 0: Placeholder con estructura básica
 */

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, Clock, Users, Star, BookOpen, Award, 
  CheckCircle, ShoppingCart, MessageSquare, ChevronDown,
  Globe, Calendar, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StoreNavbar from '@/components/store/StoreNavbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';

const CourseDetail: React.FC = () => {
  const { courseId } = useParams();
  const { language } = useLanguage();
  const { addItem, isInCart } = useCart();

  // Placeholder course data
  const course = {
    id: courseId || '1',
    title: language === 'es' ? 'CRM Avanzado para Empresas' : 'Advanced CRM for Business',
    description: language === 'es' 
      ? 'Aprende a dominar las herramientas CRM más potentes del mercado. Este curso te llevará desde los conceptos básicos hasta las estrategias avanzadas de gestión de relaciones con clientes.'
      : 'Learn to master the most powerful CRM tools on the market. This course will take you from basic concepts to advanced customer relationship management strategies.',
    instructor: {
      name: 'María García',
      title: language === 'es' ? 'Experta en CRM & Customer Success' : 'CRM & Customer Success Expert',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      bio: language === 'es' 
        ? '15 años de experiencia en implementación de CRM para empresas Fortune 500'
        : '15 years of experience implementing CRM for Fortune 500 companies',
    },
    category: 'CRM',
    level: 'intermediate',
    duration: 12,
    lessons: 48,
    students: 1250,
    rating: 4.8,
    reviews: 342,
    price: 199,
    salePrice: 149,
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    language: language === 'es' ? 'Español' : 'Spanish',
    lastUpdated: '2024-12-15',
    modules: [
      {
        id: '1',
        title: language === 'es' ? 'Introducción al CRM' : 'Introduction to CRM',
        lessons: 8,
        duration: 120,
        isPreview: true,
      },
      {
        id: '2',
        title: language === 'es' ? 'Configuración Avanzada' : 'Advanced Configuration',
        lessons: 10,
        duration: 180,
        isPreview: false,
      },
      {
        id: '3',
        title: language === 'es' ? 'Automatización de Procesos' : 'Process Automation',
        lessons: 12,
        duration: 200,
        isPreview: false,
      },
      {
        id: '4',
        title: language === 'es' ? 'Análisis y Reportes' : 'Analytics & Reports',
        lessons: 10,
        duration: 150,
        isPreview: false,
      },
      {
        id: '5',
        title: language === 'es' ? 'Integración con IA' : 'AI Integration',
        lessons: 8,
        duration: 140,
        isPreview: false,
      },
    ],
    learningObjectives: [
      language === 'es' ? 'Dominar las funcionalidades avanzadas del CRM' : 'Master advanced CRM features',
      language === 'es' ? 'Automatizar procesos de ventas y marketing' : 'Automate sales and marketing processes',
      language === 'es' ? 'Crear dashboards y reportes personalizados' : 'Create custom dashboards and reports',
      language === 'es' ? 'Integrar IA para predicción de ventas' : 'Integrate AI for sales prediction',
      language === 'es' ? 'Optimizar el customer journey' : 'Optimize the customer journey',
    ],
    requirements: [
      language === 'es' ? 'Conocimientos básicos de ventas' : 'Basic sales knowledge',
      language === 'es' ? 'Familiaridad con herramientas digitales' : 'Familiarity with digital tools',
      language === 'es' ? 'Acceso a ordenador con internet' : 'Computer with internet access',
    ],
  };

  const handleAddToCart = () => {
    addItem({
      id: course.id,
      moduleKey: `course-${course.id}`,
      name: course.title,
      price: course.salePrice || course.price,
      quantity: 1,
      licenseType: 'perpetual',
      image: course.thumbnail,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <StoreNavbar />

      <div className="container mx-auto px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-slate-400 text-sm mb-6"
        >
          <Link to="/academia" className="hover:text-white transition-colors">Academia</Link>
          <span>/</span>
          <Link to="/academia/cursos" className="hover:text-white transition-colors">
            {language === 'es' ? 'Cursos' : 'Courses'}
          </Link>
          <span>/</span>
          <span className="text-white">{course.title}</span>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                {course.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {course.title}
              </h1>
              <p className="text-slate-300 text-lg mb-6">{course.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-medium">{course.rating}</span>
                  <span className="text-slate-400">({course.reviews} {language === 'es' ? 'reseñas' : 'reviews'})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.students.toLocaleString()} {language === 'es' ? 'estudiantes' : 'students'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <span>{course.language}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={course.instructor.avatar} />
                  <AvatarFallback>{course.instructor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{course.instructor.name}</p>
                  <p className="text-sm text-slate-400">{course.instructor.title}</p>
                </div>
              </div>
            </motion.div>

            {/* Preview Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative aspect-video rounded-xl overflow-hidden group"
            >
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="lg" className="gap-2">
                  <Play className="w-5 h-5 fill-current" />
                  {language === 'es' ? 'Ver preview' : 'Watch preview'}
                </Button>
              </div>
            </motion.div>

            {/* Learning Objectives */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
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
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-1 shrink-0" />
                        <span className="text-slate-300 text-sm">{objective}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Course Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {language === 'es' ? 'Contenido del curso' : 'Course content'}
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    {course.modules.length} {language === 'es' ? 'módulos' : 'modules'} • 
                    {course.lessons} {language === 'es' ? 'lecciones' : 'lessons'} • 
                    {course.duration}h {language === 'es' ? 'de contenido' : 'of content'}
                  </p>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-2">
                    {course.modules.map((module, index) => (
                      <AccordionItem 
                        key={module.id} 
                        value={module.id}
                        className="border border-slate-700 rounded-lg px-4 data-[state=open]:bg-slate-700/30"
                      >
                        <AccordionTrigger className="text-white hover:no-underline py-4">
                          <div className="flex items-center gap-4 text-left">
                            <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{module.title}</p>
                              <p className="text-xs text-slate-400">
                                {module.lessons} {language === 'es' ? 'lecciones' : 'lessons'} • 
                                {Math.floor(module.duration / 60)}h {module.duration % 60}min
                              </p>
                            </div>
                            {module.isPreview && (
                              <Badge variant="outline" className="ml-auto text-xs border-primary/50 text-primary">
                                Preview
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-400 pb-4">
                          <div className="pl-12 space-y-2">
                            <p className="text-sm">
                              {language === 'es' 
                                ? 'Contenido del módulo disponible tras la inscripción'
                                : 'Module content available after enrollment'}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Chatbot Feature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {language === 'es' ? 'Tutor IA Especializado' : 'Specialized AI Tutor'}
                      </h3>
                      <p className="text-slate-300 text-sm">
                        {language === 'es' 
                          ? 'Este curso incluye un chatbot de IA entrenado específicamente en el contenido del curso. Resuelve tus dudas 24/7 con respuestas precisas y contextualizadas.'
                          : 'This course includes an AI chatbot trained specifically on course content. Get your questions answered 24/7 with precise and contextualized responses.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-28"
            >
              <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                <CardContent className="p-6">
                  {/* Price */}
                  <div className="mb-6">
                    {course.salePrice ? (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-white">€{course.salePrice}</span>
                        <span className="text-lg text-slate-400 line-through">€{course.price}</span>
                        <Badge className="bg-green-500/20 text-green-400 border-0">
                          -{Math.round((1 - course.salePrice / course.price) * 100)}%
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-white">€{course.price}</span>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3 mb-6">
                    {isInCart(`course-${course.id}`) ? (
                      <Button className="w-full" size="lg" asChild>
                        <Link to="/store/checkout">
                          {language === 'es' ? 'Ir al carrito' : 'Go to cart'}
                        </Link>
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {language === 'es' ? 'Añadir al carrito' : 'Add to cart'}
                      </Button>
                    )}
                    <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700" size="lg">
                      {language === 'es' ? 'Comprar ahora' : 'Buy now'}
                    </Button>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{course.duration} {language === 'es' ? 'horas de contenido' : 'hours of content'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span>{course.lessons} {language === 'es' ? 'lecciones' : 'lessons'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>{language === 'es' ? 'Tutor IA 24/7' : 'AI Tutor 24/7'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Award className="w-4 h-4 text-slate-400" />
                      <span>{language === 'es' ? 'Certificado de finalización' : 'Certificate of completion'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{language === 'es' ? 'Acceso de por vida' : 'Lifetime access'}</span>
                    </div>
                  </div>

                  {/* Guarantee */}
                  <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                    <p className="text-xs text-slate-400">
                      {language === 'es' 
                        ? 'Garantía de devolución de 30 días'
                        : '30-day money-back guarantee'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
