import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Lightbulb, Building2, CreditCard, GraduationCap, Briefcase, Factory, HeartPulse } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SectorCardProps {
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
  href: string;
  delay?: number;
}

const SectorCard: React.FC<SectorCardProps> = ({ icon: Icon, titleKey, descriptionKey, href, delay = 0 }) => {
  const { t } = useLanguage();
  
  return (
    <Link to={href}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.4 }}
        whileHover={{ y: -5, scale: 1.02 }}
        className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30 rounded-2xl p-6 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 cursor-pointer h-full"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-blue-500/30 group-hover:to-violet-500/30 transition-colors">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
              {t(titleKey)}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t(descriptionKey)}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

const sectors = [
  {
    icon: ShoppingCart,
    titleKey: 'landing.sectors.ecommerce.title',
    descriptionKey: 'landing.sectors.ecommerce.description',
    href: '/sectores/ecommerce',
  },
  {
    icon: Lightbulb,
    titleKey: 'landing.sectors.infoproducers.title',
    descriptionKey: 'landing.sectors.infoproducers.description',
    href: '/sectores/infoproductores',
  },
  {
    icon: Building2,
    titleKey: 'landing.sectors.agencies.title',
    descriptionKey: 'landing.sectors.agencies.description',
    href: '/sectores/agencias',
  },
  {
    icon: CreditCard,
    titleKey: 'landing.sectors.subscriptions.title',
    descriptionKey: 'landing.sectors.subscriptions.description',
    href: '/sectores/suscripciones',
  },
  {
    icon: GraduationCap,
    titleKey: 'landing.sectors.education.title',
    descriptionKey: 'landing.sectors.education.description',
    href: '/sectores/educacion',
  },
  {
    icon: Briefcase,
    titleKey: 'landing.sectors.banking.title',
    descriptionKey: 'landing.sectors.banking.description',
    href: '/sectores/banca',
  },
  {
    icon: Factory,
    titleKey: 'landing.sectors.manufacturing.title',
    descriptionKey: 'landing.sectors.manufacturing.description',
    href: '/sectores/manufactura',
  },
  {
    icon: HeartPulse,
    titleKey: 'landing.sectors.healthcare.title',
    descriptionKey: 'landing.sectors.healthcare.description',
    href: '/sectores/salud',
  },
];

export const SectorsSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-slate-950 to-[#0c1222]" />
      
      {/* Gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-600/10 via-violet-600/10 to-blue-600/10 rounded-full blur-[200px]" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400 mb-6">
            {t('landing.sectors.badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {t('landing.sectors.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              {t('landing.sectors.titleHighlight')}
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            {t('landing.sectors.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectors.map((sector, index) => (
            <SectorCard
              key={sector.titleKey}
              icon={sector.icon}
              titleKey={sector.titleKey}
              descriptionKey={sector.descriptionKey}
              href={sector.href}
              delay={index * 0.05}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectorsSection;
