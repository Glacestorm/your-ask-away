import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Layers, GitBranch, Users, Settings, BarChart3, FolderKanban, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

const AgenciasLanding: React.FC = () => {
  const { trackPageView } = useMarketingAnalytics();

  useEffect(() => {
    trackPageView('Agencias Landing');
  }, [trackPageView]);

  const features = [
    { icon: FolderKanban, title: 'Multi-Proyecto', desc: 'Gestiona múltiples clientes desde un solo panel' },
    { icon: Workflow, title: 'Funnels Independientes', desc: 'Automatizaciones personalizadas por cliente' },
    { icon: Users, title: 'Equipos', desc: 'Asigna gestores y permisos por proyecto' },
    { icon: BarChart3, title: 'Reportes White-Label', desc: 'Informes personalizados con tu marca' },
  ];

  const stats = [
    { value: '+40%', label: 'Eficiencia operativa' },
    { value: '5x', label: 'Más proyectos gestionados' },
    { value: '-60%', label: 'Tiempo en reporting' },
    { value: '+35%', label: 'Retención de clientes' },
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
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 mb-6">
              <Building2 className="w-4 h-4" />
              Agencias y Negocios Locales
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              CRM para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Agencias
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
              Ten control de múltiples proyectos con funnels y automatizaciones independientes. 
              Escala tu agencia sin perder calidad.
            </p>
            <Link to="/demo">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
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
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">{stat.value}</div>
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
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-purple-400 mb-4" />
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
          <h2 className="text-3xl font-bold text-white mb-6">¿Listo para escalar tu agencia?</h2>
          <Link to="/demo">
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              Empezar Ahora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AgenciasLanding;
