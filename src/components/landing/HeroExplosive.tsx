import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DemoRequestModal from '@/components/store/DemoRequestModal';

export const HeroExplosive: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Premium Dark Background with Blue/Violet Gradient */}
        <div className="absolute inset-0 bg-[#0a0f1a]">
          {/* Main gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-slate-950 to-violet-950/50" />
          
          {/* Animated gradient orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/30 to-blue-400/20 rounded-full blur-[150px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-violet-600/30 to-purple-400/20 rounded-full blur-[150px]"
          />
          
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
            }}
          />

          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10 pt-32 pb-24">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/20 to-violet-500/20 border border-blue-400/30 text-sm font-medium text-blue-300">
                <Sparkles className="w-4 h-4" />
                CRM CON IA INTEGRADA
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6"
            >
              No somos solo un CRM.
              <br />
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400">
                  Somos ObelixIA
                </span>
                {/* Underline glow */}
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full origin-left"
                />
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-400 font-light mb-4 max-w-3xl mx-auto"
            >
              Quien usa ObelixIA no acompaña el mercado.{' '}
              <span className="text-white font-medium">Lo innova.</span>
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              IA, automatizaciones con reglas de negocio inteligentes, BI interno, 
              mensajería conectada y decisiones en tiempo real — todo fluyendo en un 
              sistema creado para escalar contigo.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link to="/precios">
                <Button 
                  size="lg"
                  className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full shadow-2xl shadow-blue-500/30 transition-all duration-300 hover:shadow-blue-500/50 hover:scale-105"
                >
                  CONSULTAR PLANOS
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsDemoModalOpen(true)}
                className="h-14 px-8 text-base font-semibold bg-white/5 border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-full transition-all duration-300 backdrop-blur-sm"
              >
                <Play className="mr-2 w-5 h-5" />
                AGENDAR DEMO
              </Button>
            </motion.div>

            {/* CRM Screenshot/Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
              className="relative mx-auto max-w-5xl"
            >
              {/* Glow behind mockup */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-violet-600/20 blur-3xl scale-110" />
              
              {/* Mockup container */}
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-2 backdrop-blur-sm shadow-2xl">
                {/* Browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-slate-800 rounded-md text-sm text-slate-400">
                      app.obelixia.com
                    </div>
                  </div>
                </div>
                
                {/* CRM Interface Preview */}
                <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-[#0f172a] rounded-b-xl overflow-hidden">
                  {/* Kanban Board Preview */}
                  <div className="absolute inset-0 p-6">
                    <div className="grid grid-cols-5 gap-4 h-full opacity-80">
                      {['Lead Nuevo', 'Contactado', 'En Negociación', 'Propuesta', 'Cerrado'].map((col, i) => (
                        <div key={col} className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400">{col}</span>
                            <span className="text-xs text-slate-500">{3 + i}</span>
                          </div>
                          {[...Array(3)].map((_, j) => (
                            <motion.div
                              key={j}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.8 + i * 0.1 + j * 0.05 }}
                              className="bg-slate-800/80 border border-slate-700/50 rounded-lg p-3"
                            >
                              <div className="w-full h-2 bg-slate-700 rounded mb-2" />
                              <div className="w-2/3 h-2 bg-slate-700/50 rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500" />
                                <div className="flex-1">
                                  <div className="w-16 h-1.5 bg-slate-700/50 rounded" />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Overlay glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          >
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-2 rounded-full bg-white/60" 
            />
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

export default HeroExplosive;
