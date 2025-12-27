import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, CheckCircle2, TrendingUp, Package, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import { SectorModulesSection } from '@/components/sectors/SectorModulesSection';

const RetailLanding: React.FC = () => {
  const { trackPageView } = useMarketingAnalytics();

  useEffect(() => {
    trackPageView('retail');
  }, [trackPageView]);

  const features = [
    { icon: ShoppingCart, title: "Gestión Omnicanal", desc: "Unifica ventas físicas, online y marketplaces" },
    { icon: Package, title: "Inventario Inteligente", desc: "Predicción de demanda y reposición automática" },
    { icon: Users, title: "Fidelización 360", desc: "Programa de lealtad con segmentación avanzada" },
    { icon: BarChart3, title: "Analytics en Tiempo Real", desc: "Dashboards de ventas y comportamiento de clientes" },
  ];

  const stats = [
    { value: "+22%", label: "Ventas cruzadas" },
    { value: "-40%", label: "Roturas de stock" },
    { value: "+35%", label: "Retención clientes" },
    { value: "3x", label: "ROI marketing" },
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
          <div className="w-20 h-20 mx-auto mb-6 bg-orange-500/20 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-orange-400" />
          </div>
          <Badge className="mb-4 bg-orange-500/20 text-orange-300 border-orange-500/30">
            SECTOR RETAIL
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Obelixia para Retail
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Transforma tu negocio retail con gestión omnicanal, inventario inteligente
            y experiencia de cliente personalizada impulsada por IA.
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
              <div className="text-3xl font-bold text-orange-400 mb-2">{stat.value}</div>
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
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Módulos Recomendados */}
        <SectorModulesSection sectorSlug="retail" accentColor="orange" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Link to="/demo">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
              Solicitar Demo para Retail
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default RetailLanding;
