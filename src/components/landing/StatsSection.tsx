import React from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, MessageSquare, Zap } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const stats: StatItem[] = [
  {
    value: 600,
    suffix: '+',
    label: 'Empresas activas',
    icon: Building2,
    description: 'confían en ObelixIA',
  },
  {
    value: 1600,
    suffix: '',
    label: 'Usuarios diarios',
    icon: Users,
    description: 'gestionando su negocio',
  },
  {
    value: 200,
    suffix: 'K+',
    label: 'Mensajes/día',
    icon: MessageSquare,
    description: 'procesados con IA',
  },
  {
    value: 5,
    suffix: ' min',
    label: 'SLA Soporte',
    icon: Zap,
    description: 'tiempo primera respuesta',
  },
];

export const StatsSection: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0f172a] to-slate-950" />
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400 mb-6">
            Métricas en tiempo real
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Quien ya usa ObelixIA{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              no vuelve atrás
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-500 overflow-hidden">
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center mb-6">
                    <stat.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    <AnimatedCounter 
                      end={stat.value} 
                      suffix={stat.suffix}
                      duration={2.5}
                    />
                  </div>
                  
                  <p className="text-lg font-semibold text-slate-300 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-sm text-slate-500">
                    {stat.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
