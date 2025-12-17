import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Star, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import DemoRequestModal from './DemoRequestModal';

const HeroSection: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30" />
          
          {/* Animated Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          />
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.3) 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Hero Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-8 flex justify-center"
            >
              <ObelixiaLogo size="hero" variant="full" animated dark />
            </motion.div>
            
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Badge className="mb-6 px-4 py-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur">
                <Star className="w-4 h-4 mr-2 fill-emerald-400 text-emerald-400" />
                #1 en CRM Empresarial Inteligente
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Transforma tu{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                  Empresa
                </span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                />
              </span>
              <br />
              con Inteligencia Artificial
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto"
            >
              Plataforma modular de gestión empresarial con{' '}
              <span className="text-emerald-400 font-semibold">IA integrada</span>,{' '}
              <span className="text-emerald-400 font-semibold">compliance bancario</span> y{' '}
              <span className="text-emerald-400 font-semibold">análisis predictivo</span>
            </motion.p>

            {/* Price Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex flex-col items-center gap-2 mb-10 px-6 py-4 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Desde</span>
                <span className="text-3xl font-bold text-white">€99,000</span>
                <span className="text-slate-400">/año</span>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Ahorra 40%
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>SIN IVA</span>
                <span>•</span>
                <span>Licencia anual renovable</span>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link to="/store/modules">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 h-[60px] py-0 leading-none text-lg rounded-xl shadow-lg shadow-emerald-500/25 w-full sm:w-auto inline-flex items-center justify-center"
                >
                  Explorar Módulos
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              
              {/* Ver Demo Button with gradient and pulse */}
              <motion.button
                onClick={() => setIsDemoModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative overflow-hidden px-8 h-[60px] py-0 leading-none rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 text-white shadow-[0_6px_20px_rgba(34,211,238,0.4)] hover:from-blue-400 hover:via-cyan-400 hover:to-emerald-400 hover:shadow-[0_8px_24px_rgba(34,211,238,0.5)] transition-all duration-300 w-full sm:w-auto inline-flex items-center justify-center"
              >
                <span className="absolute inset-0 rounded-xl animate-ping bg-cyan-400/30" style={{ animationDuration: '1.5s' }} />
                <span className="absolute inset-0 rounded-xl animate-pulse bg-cyan-400/20" style={{ animationDuration: '2s' }} />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  Ver Demo
                </span>
              </motion.button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>ISO 27001 Certificado</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>GDPR & DORA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>4.9/5 Rating</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* Demo Request Modal */}
      <DemoRequestModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </>
  );
};

export default HeroSection;
