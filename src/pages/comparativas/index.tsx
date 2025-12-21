import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, GitCompare, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSectors } from '@/hooks/useSectors';
import { SectorComparison } from '@/components/sectors/SectorComparison';
import { Skeleton } from '@/components/ui/skeleton';

const ComparativasPage: React.FC = () => {
  const { sectors, loading } = useSectors({});

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />

        <div className="container mx-auto px-6 relative">
          {/* Back link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <GitCompare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Comparativa de Sectores</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Compara soluciones sectoriales
            </h1>
            <p className="text-xl text-slate-400">
              Analiza lado a lado las funcionalidades, capacidades IA y normativas 
              de cada sector para encontrar la solución perfecta para tu negocio.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Comparison Tool */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <Skeleton className="h-8 w-48 mb-4 bg-slate-800" />
              <div className="flex gap-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-32 rounded-full bg-slate-800" />
                ))}
              </div>
              <Skeleton className="h-96 w-full bg-slate-800 rounded-xl" />
            </div>
          ) : (
            <SectorComparison sectors={sectors} />
          )}
        </div>
      </section>

      {/* AI Recommendation CTA */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border border-slate-800 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 md:p-12 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />
            
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-display font-bold text-white mb-2">
                  ¿No sabes qué sector elegir?
                </h3>
                <p className="text-slate-400 max-w-xl">
                  Usa nuestro recomendador inteligente. Introduce tu código CNAE y 
                  la IA te sugerirá la solución más adecuada para tu negocio.
                </p>
              </div>
              <Link to="/#sectors">
                <button className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                  Probar Recomendador IA
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ComparativasPage;
