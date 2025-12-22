import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, MessageCircle, Calendar, Users, Video, BarChart3, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

const EducacionLanding: React.FC = () => {
  const { trackPageView } = useMarketingAnalytics();

  useEffect(() => {
    trackPageView('Educacion Landing');
  }, [trackPageView]);

  const features = [
    { icon: BookOpen, title: 'Gestión de Clases', desc: 'Organiza cursos, módulos y materiales' },
    { icon: Users, title: 'CRM de Estudiantes', desc: 'Seguimiento completo del alumno' },
    { icon: MessageCircle, title: 'Mensajería Integrada', desc: 'Comunicación directa con estudiantes' },
    { icon: BarChart3, title: 'Analytics Educativo', desc: 'Métricas de progreso y engagement' },
  ];

  const stats = [
    { value: '+55%', label: 'Retención de alumnos' },
    { value: '3x', label: 'Conversión de leads' },
    { value: '-40%', label: 'Tiempo administrativo' },
    { value: '+70%', label: 'Satisfacción del estudiante' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 mb-6">
              <GraduationCap className="w-4 h-4" />
              Educación y Cursos Online
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              CRM para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Educación
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
              Clases, leads y atendimiento en un solo lugar con mensajería y datos integrados. 
              Transforma la experiencia educativa con IA.
            </p>
            <Link to="/demo">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                Solicitar Demo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-slate-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Funcionalidades Clave</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/30 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">¿Listo para transformar tu institución educativa?</h2>
          <Link to="/demo">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
              Empezar Ahora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default EducacionLanding;
