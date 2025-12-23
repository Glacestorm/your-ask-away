import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, Lock, CheckCircle, Globe, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const TrustBadges: React.FC = () => {
  const { t } = useLanguage();

  const certifications = [
    { icon: Shield, label: 'ISO 27001', description: t('store.trustBadges.items.iso27001') },
    { icon: Lock, label: 'GDPR', description: t('store.trustBadges.items.gdpr') },
    { icon: Award, label: 'DORA', description: t('store.trustBadges.items.dora') },
    { icon: CheckCircle, label: 'NIS2', description: t('store.trustBadges.items.nis2') },
    { icon: Globe, label: 'PSD2/PSD3', description: t('store.trustBadges.items.psd') },
    { icon: Clock, label: '99.99%', description: t('store.trustBadges.items.uptime') },
  ];

  return (
    <section className="py-16 bg-slate-900/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-lg font-medium text-slate-400 mb-2">{t('store.trustBadges.title')}</h3>
          <p className="text-sm text-slate-500">{t('store.trustBadges.subtitle')}</p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-8">
          {certifications.map((cert, index) => (
            <motion.div
              key={cert.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-3">
                <cert.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-lg font-bold text-white">{cert.label}</span>
              <span className="text-xs text-slate-500">{cert.description}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
