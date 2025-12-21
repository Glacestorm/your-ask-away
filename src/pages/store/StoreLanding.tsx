import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Zap, Globe, Lock, ArrowRight, CheckCircle2, Sparkles, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { MarketingTabs } from '@/components/marketing';
import NewsTicker from '@/components/news/NewsTicker';
import PremiumNewsCard from '@/components/news/PremiumNewsCard';
import NewsSearch from '@/components/news/NewsSearch';
import { useNewsArticles } from '@/hooks/useNewsArticles';
import { FAQSection, FAQChatWidget } from '@/components/faq';
import { SectorsShowcase } from '@/components/sectors';

const StoreLanding: React.FC = () => {
  const { t } = useLanguage();
  const { articles } = useNewsArticles({ limit: 10 });

  // Transform articles for ticker
  const tickerItems = articles.slice(0, 6).map(article => ({
    id: article.id,
    title: article.title,
    category: article.category || 'Noticias'
  }));

  const features = [
    { 
      icon: Shield, 
      title: 'Seguridad Bancaria',
      description: 'Cumplimiento normativo PSD2, GDPR y estándares internacionales de seguridad.'
    },
    { 
      icon: Zap, 
      title: 'IA Integrada',
      description: 'Predicciones, automatización y análisis en tiempo real con machine learning.'
    },
    { 
      icon: Globe, 
      title: 'Multi-Sector',
      description: 'Adaptable a banca, seguros, retail y manufactura con módulos especializados.'
    },
    { 
      icon: Lock, 
      title: 'Arquitectura Modular',
      description: 'Implementa solo lo que necesitas, escala cuando lo requieras.'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <StoreNavbar />
      
      {/* Hero */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center mb-20"
          >
            <span className="text-sm font-medium text-primary uppercase tracking-wider mb-4 block">
              Por qué elegirnos
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-semibold text-white mb-6">
              Tecnología que impulsa resultados
            </h2>
            <p className="text-lg text-slate-400">
              Diseñado para empresas que buscan la excelencia operativa 
              y la transformación digital real.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors Showcase - Industries we serve */}
      <SectorsShowcase />

      {/* Marketing Section */}
      <MarketingTabs />

      {/* Modules Section */}
      <div id="modules">
        <FeaturedModules />
      </div>

      {/* Premium Section */}
      <PremiumModulesSection />

      {/* Bundles Section */}
      <div id="bundles">
        <BundlesSection />
      </div>

      {/* Contact Section */}
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
        <ROICalculator />
        <div className="container mx-auto px-6">
          <PricingExplanation />
        </div>
      </div>

      {/* Trust Badges */}
      <TrustBadges />


      {/* Final CTA Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Background */}
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

      {/* News Ticker (justo antes de Noticias) */}
      {/* FAQ Section */}
      <FAQSection />

      {/* News Section */}
      {articles.length > 0 && (
        <section id="news" className="py-24 relative">
          <div className="container mx-auto px-6">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                <Newspaper className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Actualización IA</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-white mb-4">
                Noticias Empresariales
              </h2>
              <p className="text-lg text-slate-400">
                Las últimas novedades del sector analizadas por inteligencia artificial
              </p>
            </motion.div>

            {/* News Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <NewsSearch />
            </motion.div>

            {/* News Ticker - Above the grid */}
            {tickerItems.length > 0 && (
              <div className="mb-8">
                <NewsTicker items={tickerItems} />
              </div>
            )}

            {/* News Grid - 3 columns with larger cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {articles.slice(0, 3).map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="h-full"
                >
                  <PremiumNewsCard
                    article={{
                      id: article.id,
                      title: article.title,
                      slug: article.slug || article.id,
                      excerpt: article.ai_summary || article.content?.substring(0, 150) || '',
                      image_url: article.image_url || '',
                      image_credit: article.image_credit || article.source_name || 'Fuente',
                      source_name: article.source_name || 'Fuente',
                      source_url: article.source_url || '',
                      category: article.category || 'Noticias',
                      tags: article.tags || [],
                      published_at: article.published_at,
                      ai_summary: article.ai_summary || '',
                      relevance_score: article.relevance_score || 0,
                      fetched_at: article.fetched_at || article.published_at
                    }}
                    index={index}
                    variant="default"
                  />
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Link to="/blog">
                <Button
                  variant="outline"
                  className="h-12 px-8 text-base font-medium border-slate-700 text-white hover:bg-slate-800 rounded-full"
                >
                  Ver todas las noticias
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      <StoreFooter />
      <CartSidebar />
      <FAQChatWidget />
    </div>
  );
};

export default StoreLanding;
