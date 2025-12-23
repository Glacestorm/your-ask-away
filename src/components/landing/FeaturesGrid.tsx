import React from 'react';
import { motion } from 'framer-motion';
import { Brain, BarChart3, Puzzle, MessageSquare, Workflow, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeatureCardProps {
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
  gradient: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, titleKey, descriptionKey, gradient, delay = 0 }) => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="group relative"
    >
      <div className="relative h-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-500 overflow-hidden">
        {/* Hover glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        
        <div className="relative z-10">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient.replace('/5', '/20').replace('/10', '/30')} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors">
            {t(titleKey)}
          </h3>
          <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
            {t(descriptionKey)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const features = [
  {
    icon: Brain,
    titleKey: 'landing.features.ai.title',
    descriptionKey: 'landing.features.ai.description',
    gradient: 'from-blue-600/5 to-violet-600/10',
  },
  {
    icon: BarChart3,
    titleKey: 'landing.features.bi.title',
    descriptionKey: 'landing.features.bi.description',
    gradient: 'from-emerald-600/5 to-cyan-600/10',
  },
  {
    icon: Puzzle,
    titleKey: 'landing.features.integrations.title',
    descriptionKey: 'landing.features.integrations.description',
    gradient: 'from-orange-600/5 to-amber-600/10',
  },
  {
    icon: Workflow,
    titleKey: 'landing.features.workflows.title',
    descriptionKey: 'landing.features.workflows.description',
    gradient: 'from-pink-600/5 to-rose-600/10',
  },
  {
    icon: MessageSquare,
    titleKey: 'landing.features.omnichannel.title',
    descriptionKey: 'landing.features.omnichannel.description',
    gradient: 'from-violet-600/5 to-purple-600/10',
  },
  {
    icon: Target,
    titleKey: 'landing.features.kanbans.title',
    descriptionKey: 'landing.features.kanbans.description',
    gradient: 'from-cyan-600/5 to-blue-600/10',
  },
];

export const FeaturesGrid: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0c1222] to-slate-950" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400 mb-6">
            {t('landing.features.badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {t('landing.features.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              {t('landing.features.titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.titleKey}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
