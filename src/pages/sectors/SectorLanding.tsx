import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Landmark, Shield, BarChart3, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectorsGrid } from '@/components/marketing';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

const SectorLanding: React.FC = () => {
  const { trackPageView } = useMarketingAnalytics();

  useEffect(() => {
    trackPageView('sectors');
  }, [trackPageView]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-16">
        <Link to="/store" className="inline-flex items-center text-slate-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Store
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            SOLUCIONES POR SECTOR
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Soluciones Especializadas
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Obelixia ofrece soluciones adaptadas a las necesidades específicas de cada sector,
            con cumplimiento normativo integrado y herramientas de IA especializadas.
          </p>
        </motion.div>

        <SectorsGrid />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <Link to="/store#marketing">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Solicitar Demo Personalizada
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default SectorLanding;
