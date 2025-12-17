import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Shield, Zap, Globe, Award, CheckCircle2, 
  TrendingUp, Users, Lock, Sparkles, Building2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import StoreNavbar from '@/components/store/StoreNavbar';
import HeroSection from '@/components/store/HeroSection';
import FeaturedModules from '@/components/store/FeaturedModules';
import PremiumModulesSection from '@/components/store/PremiumModulesSection';
import BundlesSection from '@/components/store/BundlesSection';
import TrustBadges from '@/components/store/TrustBadges';
import ROICalculator from '@/components/store/ROICalculator';
import PricingExplanation from '@/components/store/PricingExplanation';
import StoreFooter from '@/components/store/StoreFooter';
import CartSidebar from '@/components/store/CartSidebar';
import CNAEPricingSearch from '@/components/store/CNAEPricingSearch';

const StoreLanding: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { value: '500+', label: t('store.stats.companies'), icon: Building2 },
    { value: '99.9%', label: t('store.stats.uptime'), icon: Shield },
    { value: '€2.5M', label: t('store.stats.processed'), icon: TrendingUp },
    { value: '24/7', label: t('store.stats.support'), icon: Users },
  ];

  const features = [
    { 
      icon: Shield, 
      title: t('store.features.security.title'), 
      description: t('store.features.security.desc')
    },
    { 
      icon: Zap, 
      title: t('store.features.ai.title'), 
      description: t('store.features.ai.desc')
    },
    { 
      icon: Globe, 
      title: t('store.features.multisector.title'), 
      description: t('store.features.multisector.desc')
    },
    { 
      icon: Lock, 
      title: t('store.features.compliance.title'), 
      description: t('store.features.compliance.desc')
    },
  ];

  return (
    <div id="inicio" className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <StoreNavbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Bar */}
      <section className="relative z-10 -mt-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-emerald-600/20 via-emerald-500/10 to-emerald-600/20 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {t('store.features.badge')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('store.features.title')}
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {t('store.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Modules */}
      <div id="modules">
        <FeaturedModules />
      </div>

      {/* Premium Section */}
      <PremiumModulesSection />

      {/* Bundles */}
      <div id="bundles">
        <BundlesSection />
      </div>

      {/* CNAE Pricing Search */}
      <CNAEPricingSearch />

      {/* ROI Calculator / Pricing */}
      <div id="pricing">
        <ROICalculator />
        <div className="container mx-auto px-4">
          <PricingExplanation />
        </div>
      </div>

      {/* Trust Badges */}
      <TrustBadges />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-emerald-500/10 to-emerald-600/20" />
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Sparkles className="w-12 h-12 mx-auto mb-6 text-emerald-400" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('store.cta.title')}
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              {t('store.cta.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/25"
              >
                {t('store.cta.button1')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link to="/auth">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 px-8 py-6 text-lg rounded-xl"
                >
                  {t('store.cta.button2')}
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t('store.cta.note1')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t('store.cta.note2')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t('store.cta.note3')}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <StoreFooter />
      <CartSidebar />
    </div>
  );
};

export default StoreLanding;