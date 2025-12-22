import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, RefreshCw, TrendingUp, Bell, Users, BarChart3, ArrowUpCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

const SuscripcionesLanding: React.FC = () => {
  const { trackPageView } = useMarketingAnalytics();

  useEffect(() => {
    trackPageView('Suscripciones Landing');
  }, [trackPageView]);

  const features = [
    { icon: RefreshCw, title: 'Gestión de Renovaciones', desc: 'Automatiza cobros y recordatorios' },
    { icon: ArrowUpCircle, title: 'Upsells Inteligentes', desc: 'Detecta oportunidades de upgrade con IA' },
    { icon: Bell, title: 'Alertas de Churn', desc: 'Identifica clientes en riesgo antes de perderlos' },
    { icon: BarChart3, title: 'Métricas MRR/ARR', desc: 'Dashboard de ingresos recurrentes en tiempo real' },
  ];

  const stats = [
    { value: '-25%', label: 'Reducción de churn' },
    { value: '+40%', label: 'Upsells completados' },
    { value: '95%', label: 'Tasa de renovación' },
    { value: '+60%', label: 'LTV promedio' },
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
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-6">
              <CreditCard className="w-4 h-4" />
              Suscripciones
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              CRM para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Suscripciones
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
              Monitorea renovaciones, upsells y relacionamiento con clientes recurrentes. 
              Maximiza el LTV y reduce el churn con predicciones de IA.
            </p>
            <Link to="/demo">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
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
                <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">{stat.value}</div>
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
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-emerald-400 mb-4" />
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
          <h2 className="text-3xl font-bold text-white mb-6">¿Listo para maximizar tus suscripciones?</h2>
          <Link to="/demo">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              Empezar Ahora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default SuscripcionesLanding;
