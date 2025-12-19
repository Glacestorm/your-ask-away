import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DemoRequestForm } from '@/components/marketing';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

const DemoInteractiva: React.FC = () => {
  const { trackPageView } = useMarketingAnalytics();

  useEffect(() => {
    trackPageView('demo');
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
          <button 
            onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-2xl flex items-center justify-center hover:bg-emerald-500/30 transition-colors cursor-pointer"
          >
            <Play className="w-10 h-10 text-emerald-400" />
          </button>
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30 transition-colors"
            onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            DEMO INTERACTIVA
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Solicitar Demo
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Descubre el potencial de Obelixia con una demostración personalizada
            adaptada a las necesidades de tu empresa.
          </p>
        </motion.div>

        <div id="demo-form" className="max-w-4xl mx-auto bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <DemoRequestForm />
        </div>
      </div>
    </div>
  );
};

export default DemoInteractiva;
