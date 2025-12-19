import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Landmark, CheckCircle2, TrendingUp, Shield, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

const BancaLanding: React.FC = () => {
  const { trackPageView } = useMarketingAnalytics();

  useEffect(() => {
    trackPageView('banca');
  }, [trackPageView]);

  const features = [
    { icon: Shield, title: "Cumplimiento DORA", desc: "Gestión completa de resiliencia operativa digital" },
    { icon: TrendingUp, title: "Gestión de Mora", desc: "IA para predicción y recuperación de deuda" },
    { icon: Users, title: "KYC Automatizado", desc: "Verificación de identidad con biometría" },
    { icon: FileText, title: "Reporting EBA", desc: "Generación automática de informes regulatorios" },
  ];

  const stats = [
    { value: "98%", label: "Precisión en scoring" },
    { value: "-45%", label: "Reducción de mora" },
    { value: "24h", label: "Tiempo de onboarding" },
    { value: "100%", label: "Compliance DORA" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-16">
        <Link to="/sectores" className="inline-flex items-center text-slate-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Sectores
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
            <Landmark className="w-10 h-10 text-emerald-400" />
          </div>
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            SECTOR BANCARIO
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Obelixia para Banca
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Solución integral para entidades bancarias con cumplimiento normativo DORA,
            gestión inteligente de carteras y análisis de riesgo con IA.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-2">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex gap-4"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Link to="/store#marketing">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Solicitar Demo para Banca
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default BancaLanding;
