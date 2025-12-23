import React from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, MessageSquare, Zap } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatItem {
  value: number;
  suffix: string;
  labelKey: string;
  icon: React.ElementType;
  descriptionKey: string;
}

const stats: StatItem[] = [
  {
    value: 600,
    suffix: '+',
    labelKey: 'landing.stats.companies',
    icon: Building2,
    descriptionKey: 'landing.stats.companiesDesc',
  },
  {
    value: 1600,
    suffix: '',
    labelKey: 'landing.stats.dailyUsers',
    icon: Users,
    descriptionKey: 'landing.stats.dailyUsersDesc',
  },
  {
    value: 200,
    suffix: 'K+',
    labelKey: 'landing.stats.messages',
    icon: MessageSquare,
    descriptionKey: 'landing.stats.messagesDesc',
  },
  {
    value: 5,
    suffix: ' min',
    labelKey: 'landing.stats.sla',
    icon: Zap,
    descriptionKey: 'landing.stats.slaDesc',
  },
];

export const StatsSection: React.FC = () => {
  const { t } = useLanguage();

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
            {t('landing.stats.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('landing.stats.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              {t('landing.stats.titleHighlight')}
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.labelKey}
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
                    {t(stat.labelKey)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t(stat.descriptionKey)}
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
