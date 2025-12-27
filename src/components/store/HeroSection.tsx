import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import DemoRequestModal from './DemoRequestModal';

const HeroSection: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const { t } = useLanguage();


  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Premium Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
          
          {/* Elegant grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '100px 100px',
            }}
          />
          
          {/* Soft radial glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 pt-20 pb-8">
          <div className="max-w-4xl mx-auto">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('store.hero.badge')}
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center text-5xl md:text-6xl lg:text-7xl font-display font-semibold text-white leading-[1.1] tracking-tight mb-8"
            >
              {t('store.hero.title1')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                {t('store.hero.title3')}
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
            >
              {t('store.hero.subtitle')} {t('store.hero.feature1')}, {t('store.hero.feature2')} {t('store.hero.feature3')}.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
            >
              <Link to="/store/modules">
                <Button 
                  size="lg"
                  className="h-14 px-8 text-base font-medium bg-slate-800 text-white hover:bg-slate-700 rounded-full shadow-xl shadow-black/20 transition-all duration-300 border border-slate-600"
                >
                  {t('store.hero.cta1')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              
              <div className="relative pulse-rings-container">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="relative h-14 px-8 text-base font-medium bg-slate-700/80 border-slate-500 text-white hover:bg-slate-600 rounded-full transition-all duration-300 pulse-wave"
                >
                  <Play className="mr-2 w-5 h-5" />
                  {t('store.hero.cta2')}
                </Button>
              </div>
            </motion.div>

            {/* ObelixIA Logo with Brain */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center"
            >
              <ObelixiaLogo size="hero" variant="full" animated />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </section>

      <DemoRequestModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </>
  );
};

export default HeroSection;
