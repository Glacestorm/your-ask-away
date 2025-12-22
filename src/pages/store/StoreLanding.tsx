import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoreNavbar from '@/components/store/StoreNavbar';
import StoreFooter from '@/components/store/StoreFooter';
import CartSidebar from '@/components/store/CartSidebar';

// New explosive landing components
import { 
  HeroExplosive, 
  StatsSection, 
  CRMComparisonSection, 
  FeaturesGrid,
  SectorsSection 
} from '@/components/landing';

// Lazy load heavy components - only load when user scrolls to them
const FeaturedModules = lazy(() => import('@/components/store/FeaturedModules'));
const PremiumModulesSection = lazy(() => import('@/components/store/PremiumModulesSection'));
const BundlesSection = lazy(() => import('@/components/store/BundlesSection'));
const TrustBadges = lazy(() => import('@/components/store/TrustBadges'));
const ROICalculator = lazy(() => import('@/components/store/ROICalculator'));
const PricingExplanation = lazy(() => import('@/components/store/PricingExplanation'));
const FAQSection = lazy(() => import('@/components/faq').then(m => ({ default: m.FAQSection })));
const FAQChatWidget = lazy(() => import('@/components/faq').then(m => ({ default: m.FAQChatWidget })));
const NewsSection = lazy(() => import('@/components/store/NewsSection'));

// Minimal loading placeholder
const SectionSkeleton = () => (
  <div className="py-16 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

const StoreLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <StoreNavbar />
      
      {/* New Explosive Hero */}
      <HeroExplosive />

      {/* Stats Section */}
      <StatsSection />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* CRM Comparison */}
      <CRMComparisonSection />

      {/* Sectors */}
      <SectorsSection />

      <div id="modules">
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturedModules />
        </Suspense>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <PremiumModulesSection />
      </Suspense>

      <div id="bundles">
        <Suspense fallback={<SectionSkeleton />}>
          <BundlesSection />
        </Suspense>
      </div>

      {/* Contact Section - Static */}
      <section id="contact" className="py-32 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700/50 p-12 text-center">
              <span className="text-sm font-medium text-primary uppercase tracking-wider mb-4 block">
                Contacto Comercial
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-white mb-4">
                ¿Necesitas una solución personalizada?
              </h2>
              <p className="text-lg text-slate-400 mb-8">
                Nuestro equipo comercial te ayudará a encontrar la configuración perfecta para tu empresa.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <a 
                  href="mailto:comercial@obelixia.com"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-medium rounded-full hover:bg-slate-100 transition-colors"
                >
                  comercial@obelixia.com
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="tel:+34606770033"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-600 text-white font-medium rounded-full hover:bg-slate-800 transition-colors"
                >
                  +34 606 770 033
                </a>
              </div>
              
              <p className="text-sm text-slate-500">
                Jaime Fernández García — Representante Comercial
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <div id="pricing">
        <Suspense fallback={<SectionSkeleton />}>
          <ROICalculator />
        </Suspense>
        <div className="container mx-auto px-6">
          <Suspense fallback={<SectionSkeleton />}>
            <PricingExplanation />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <TrustBadges />
      </Suspense>

      {/* Final CTA Section - Static */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-primary/5 to-slate-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <Sparkles className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-4xl md:text-5xl font-display font-semibold text-white mb-6">
              Comienza tu transformación hoy
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Únete a más de 500 empresas que ya están optimizando sus operaciones con ObelixIA.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg"
                onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-14 px-8 text-base font-medium bg-white text-slate-900 hover:bg-slate-100 rounded-full shadow-xl"
              >
                Explorar Módulos
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link to="/auth">
                <Button 
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base font-medium border-white/20 text-white hover:bg-white/10 rounded-full"
                >
                  Crear Cuenta Gratis
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Sin tarjeta de crédito
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Configuración en minutos
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Soporte 24/7
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Suspense fallback={<SectionSkeleton />}>
        <FAQSection />
      </Suspense>

      {/* News - only loads when scrolled into view */}
      <Suspense fallback={<SectionSkeleton />}>
        <NewsSection />
      </Suspense>

      <StoreFooter />
      <CartSidebar />
      
      <Suspense fallback={null}>
        <FAQChatWidget />
      </Suspense>
    </div>
  );
};

export default StoreLanding;
