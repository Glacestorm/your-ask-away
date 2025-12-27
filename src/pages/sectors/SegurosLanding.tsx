import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle2, TrendingUp, FileText, Users, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import { SectorModulesSection } from '@/components/sectors/SectorModulesSection';

const SegurosLanding: React.FC = () => {
  const { trackPageView } = useMarketingAnalytics();

  useEffect(() => {
    trackPageView('seguros');
  }, [trackPageView]);

  const features = [
    { icon: Shield, title: "Gestión de Pólizas", desc: "Administración completa del ciclo de vida de pólizas" },
    { icon: Brain, title: "Scoring de Riesgo con IA", desc: "Evaluación automatizada de riesgos y pricing dinámico" },
    { icon: FileText, title: "Gestión de Siniestros", desc: "Workflow automatizado para tramitación de claims" },
    { icon: Users, title: "Portal del Asegurado", desc: "Autoservicio y comunicación omnicanal" },
  ];

  const stats = [
    { value: "-35%", label: "Tiempo gestión siniestros" },
    { value: "92%", label: "Precisión scoring" },
    { value: "+28%", label: "Satisfacción cliente" },
    { value: "100%", label: "Compliance Solvencia II" },
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
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/20 rounded-2xl flex items-center justify-center">
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
            SECTOR SEGUROS
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Obelixia para Seguros
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Plataforma integral para aseguradoras y corredurías con gestión de pólizas,
            siniestros, scoring de riesgo con IA y compliance regulatorio.
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
              <div className="text-3xl font-bold text-blue-400 mb-2">{stat.value}</div>
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
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Módulos Recomendados */}
        <SectorModulesSection sectorSlug="seguros" accentColor="blue" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Link to="/demo">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Solicitar Demo para Seguros
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default SegurosLanding;
