/**
 * AcademiaLanding - Landing page de ObelixIA Academia
 * Optimizada para carga rápida con animaciones ligeras
 */

import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GraduationCap, BookOpen, Award, Users, Play, 
  ArrowRight, Star, Clock, BarChart3, MessageSquare,
  CheckCircle, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import StoreNavbar from '@/components/store/StoreNavbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { AIRecommendationsPanel } from '@/components/academia/AIRecommendationsPanel';

// Animaciones optimizadas - más rápidas y ligeras
const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.05 } }
};

// Memoized Feature Card para evitar re-renders
const FeatureCard = memo(({ feature, index }: { feature: { icon: React.ElementType; title: string; description: string }; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.2 }}
  >
    <Card className="bg-slate-800/50 border-slate-700 hover:border-primary/50 transition-colors h-full">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
          <feature.icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
        <p className="text-slate-400 text-sm">{feature.description}</p>
      </CardContent>
    </Card>
  </motion.div>
));

FeatureCard.displayName = 'FeatureCard';

const AcademiaLanding: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();

  // Memoized data para evitar recreaciones
  const features = useMemo(() => [
    {
      icon: BookOpen,
      title: language === 'es' ? 'Cursos Profesionales' : 'Professional Courses',
      description: language === 'es' 
        ? 'Contenido diseñado por expertos del sector' 
        : 'Content designed by industry experts',
    },
    {
      icon: MessageSquare,
      title: language === 'es' ? 'Chatbot IA Especializado' : 'Specialized AI Chatbot',
      description: language === 'es' 
        ? 'Tutor inteligente para cada curso' 
        : 'Intelligent tutor for each course',
    },
    {
      icon: Award,
      title: language === 'es' ? 'Certificaciones' : 'Certifications',
      description: language === 'es' 
        ? 'Acredita tus conocimientos' 
        : 'Certify your knowledge',
    },
    {
      icon: BarChart3,
      title: language === 'es' ? 'Seguimiento de Progreso' : 'Progress Tracking',
      description: language === 'es' 
        ? 'Monitoriza tu avance en tiempo real' 
        : 'Monitor your progress in real-time',
    },
  ], [language]);

  const navLinks = useMemo(() => [
    { to: '/academia/cursos', label: language === 'es' ? 'Cursos' : 'Courses' },
    { to: '/academia/mi-perfil', label: language === 'es' ? 'Mi Perfil' : 'My Profile' },
    { to: '/academia/analytics', label: language === 'es' ? 'Analytics' : 'Analytics' },
    { to: '/academia/comunidad', label: language === 'es' ? 'Comunidad' : 'Community' },
    { to: '/academia/notificaciones', label: language === 'es' ? 'Notificaciones' : 'Notifications' },
  ], [language]);

  const stats = useMemo(() => [
    { value: '50+', label: language === 'es' ? 'Cursos' : 'Courses' },
    { value: '10K+', label: language === 'es' ? 'Estudiantes' : 'Students' },
    { value: '95%', label: language === 'es' ? 'Satisfacción' : 'Satisfaction' },
    { value: '24/7', label: language === 'es' ? 'Soporte IA' : 'AI Support' },
  ], [language]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <StoreNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects - estáticos para mejor rendimiento */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            {...fadeIn}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              {language === 'es' ? 'Nueva Plataforma de Formación' : 'New Learning Platform'}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                ObelixIA
              </span>
              <br />
              Academia
            </h1>

            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              {language === 'es' 
                ? 'Formación empresarial de nueva generación con inteligencia artificial. Aprende a tu ritmo con tutores IA especializados en cada materia.'
                : 'Next-generation business training with artificial intelligence. Learn at your own pace with AI tutors specialized in each subject.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                asChild
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white px-8"
              >
                <Link to="/academia/cursos">
                  <Play className="w-5 h-5 mr-2" />
                  {language === 'es' ? 'Explorar Cursos' : 'Explore Courses'}
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-600 text-white hover:bg-slate-800"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                {language === 'es' ? 'Ver Certificaciones' : 'View Certifications'}
              </Button>
            </div>
          </motion.div>

          {/* Stats - sin animaciones whileInView para carga más rápida */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {language === 'es' ? '¿Por qué ObelixIA Academia?' : 'Why ObelixIA Academy?'}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {language === 'es' 
                ? 'La única plataforma de formación con IA especializada para cada curso'
                : 'The only learning platform with specialized AI for each course'}
            </p>
          </div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Recommendations Section - For logged in users */}
      {user && (
        <section className="py-12 relative">
          <div className="container mx-auto px-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === 'es' ? 'Recomendado para ti' : 'Recommended for you'}
              </h2>
              <p className="text-slate-400">
                {language === 'es' 
                  ? 'Cursos seleccionados por IA basados en tu perfil'
                  : 'AI-selected courses based on your profile'}
              </p>
            </div>
            <AIRecommendationsPanel className="bg-slate-800/30 border-slate-700" />
          </div>
        </section>
      )}

      {/* Quick Links Section */}
      <section className="py-12 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-4">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.to}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <Button
                  asChild
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-800 hover:border-primary/50"
                >
                  <Link to={link.to}>
                    {link.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon CTA */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl p-12 text-center border border-primary/30">
            <Badge className="mb-4 bg-primary/30 text-primary border-0">
              {language === 'es' ? 'Próximamente' : 'Coming Soon'}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {language === 'es' ? 'Estamos preparando algo increíble' : 'We are preparing something incredible'}
            </h2>
            <p className="text-slate-300 mb-8 max-w-xl mx-auto">
              {language === 'es' 
                ? 'Regístrate para ser el primero en acceder a nuestros cursos con tutores IA personalizados'
                : 'Register to be the first to access our courses with personalized AI tutors'}
            </p>
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              <CheckCircle className="w-5 h-5 mr-2" />
              {language === 'es' ? 'Notificarme del lanzamiento' : 'Notify me of launch'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-20" />
    </div>
  );
};

export default AcademiaLanding;
