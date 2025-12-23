import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, Zap, Brain, BarChart3, MessageSquare, Shield, Workflow } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ComparisonItem {
  featureKey: string;
  othersCRM: boolean;
  obelixia: boolean;
  icon: React.ElementType;
}

const comparisons: ComparisonItem[] = [
  { featureKey: 'landing.comparison.features.ai', othersCRM: false, obelixia: true, icon: Brain },
  { featureKey: 'landing.comparison.features.bi', othersCRM: false, obelixia: true, icon: BarChart3 },
  { featureKey: 'landing.comparison.features.omnichannel', othersCRM: false, obelixia: true, icon: MessageSquare },
  { featureKey: 'landing.comparison.features.automations', othersCRM: false, obelixia: true, icon: Workflow },
  { featureKey: 'landing.comparison.features.compliance', othersCRM: false, obelixia: true, icon: Shield },
  { featureKey: 'landing.comparison.features.multiSector', othersCRM: false, obelixia: true, icon: Zap },
];

export const CRMComparisonSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0c1222] to-slate-950" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-r from-red-600/10 to-orange-600/10 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-violet-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400 mb-6">
            {t('landing.comparison.badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {t('landing.comparison.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              {t('landing.comparison.titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            {t('landing.comparison.subtitle')}
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Other CRMs Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-red-500/20 rounded-3xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-2xl font-bold text-white">{t('landing.comparison.otherCrms')}</h3>
              </div>
              
              <div className="space-y-4">
                {comparisons.map((item, index) => (
                  <motion.div
                    key={item.featureKey}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <X className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-slate-400 line-through">{t(item.featureKey)}</span>
                  </motion.div>
                ))}
              </div>

              <p className="mt-8 text-sm text-slate-500 text-center">
                {t('landing.comparison.otherCrmsNote')}
              </p>
            </div>
          </motion.div>

          {/* ObelixIA Column */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-blue-500/30 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-violet-600/5" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-2xl font-bold text-white">ObelixIA</h3>
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white text-xs font-semibold">
                    {t('landing.comparison.allInOne')}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {comparisons.map((item, index) => (
                    <motion.div
                      key={item.featureKey}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-xl hover:border-blue-400/40 transition-colors duration-300"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-violet-500/30 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <item.icon className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{t(item.featureKey)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <p className="mt-8 text-sm text-blue-300/80 text-center font-medium">
                  {t('landing.comparison.obelixiaNote')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CRMComparisonSection;
