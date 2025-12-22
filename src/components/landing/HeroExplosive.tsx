import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import DemoRequestModal from '@/components/store/DemoRequestModal';
import brainLogo from '@/assets/brain-logo-cutout.png';

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
              <span className="relative inline-flex items-center justify-center gap-4 md:gap-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400">
                  Somos ObelixIA
                </span>
                {/* Brain with active synapses and pulse waves - oval shape */}
                <span 
                  className="relative inline-flex items-center justify-center"
                  style={{ width: '1.15em', height: '0.85em' }}
                >
                  {/* Pulse wave effects - oval */}
                  <span className="absolute inset-[-25%] animate-[ping_1.5s_ease-out_infinite] bg-violet-500/25" style={{ borderRadius: '9999px' }} />
                  <span className="absolute inset-[-20%] animate-[ping_1.8s_ease-out_infinite_0.3s] bg-blue-500/20" style={{ borderRadius: '9999px' }} />
                  <span className="absolute inset-[-15%] animate-[ping_2s_ease-out_infinite_0.6s] bg-violet-400/15" style={{ borderRadius: '9999px' }} />

                  {/* Outer Glow Layer */}
                  <span 
                    className="absolute inset-[-45%] blur-2xl opacity-70 animate-pulse"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.6) 0%, rgba(59,130,246,0.4) 40%, transparent 70%)',
                    }}
                  />

                  {/* Brain Image (full) with logo-style soft mask (no square background) */}
                  <span
                    className="relative w-full h-full overflow-hidden"
                    style={{
                      borderRadius: '9999px',
                      maskImage: 'radial-gradient(ellipse 120% 100% at center, black 62%, transparent 92%)',
                      WebkitMaskImage: 'radial-gradient(ellipse 120% 100% at center, black 62%, transparent 92%)',
                    }}
                  >
                    <img 
                      src={brainLogo}
                      alt="Cerebro ObelixIA con sinapsis"
                      className="w-full h-full object-contain"
                      style={{
                        filter: 'drop-shadow(0 0 15px rgba(139,92,246,0.7)) drop-shadow(0 0 30px rgba(59,130,246,0.5))',
                      }}
                    />

                    {/* Synapsis sparkles overlay */}
                    <svg viewBox="0 0 100 80" className="absolute inset-0 w-full h-full pointer-events-none">
                      <defs>
                        <filter id="hero-sparkle-glow" x="-400%" y="-400%" width="900%" height="900%">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      {[
                        { cx: 25, cy: 25, delay: 0 },
                        { cx: 50, cy: 20, delay: 0.3 },
                        { cx: 75, cy: 28, delay: 0.6 },
                        { cx: 35, cy: 45, delay: 0.2 },
                        { cx: 65, cy: 50, delay: 0.5 },
                        { cx: 30, cy: 60, delay: 0.8 },
                        { cx: 55, cy: 55, delay: 0.4 },
                        { cx: 70, cy: 40, delay: 0.7 },
                      ].map((node, i) => (
                        <g key={i} filter="url(#hero-sparkle-glow)">
                          <circle cx={node.cx} cy={node.cy} r="1.5" fill="white">
                            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" begin={`${node.delay}s`} repeatCount="indefinite" />
                            <animate attributeName="r" values="1;2.5;1" dur="1.5s" begin={`${node.delay}s`} repeatCount="indefinite" />
                          </circle>
                        </g>
                      ))}
                    </svg>
                  </span>
                </span>
                {/* Underline glow */}
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute -bottom-2 left-0 right-[1.2em] h-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full origin-left"
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
                  CONSULTAR PLANES
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              
              {/* AGENDAR DEMO with pulse wave effect */}
              <div className="relative">
                {/* Pulse waves */}
                <span className="absolute inset-0 rounded-full animate-[ping_2s_ease-out_infinite] bg-violet-500/20" />
                <span className="absolute inset-0 rounded-full animate-[ping_2s_ease-out_infinite_0.5s] bg-violet-500/15" />
                <span className="absolute inset-0 rounded-full animate-[ping_2s_ease-out_infinite_1s] bg-violet-500/10" />
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="relative h-14 px-8 text-base font-semibold bg-white/5 border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-full transition-all duration-300 backdrop-blur-sm z-10"
                >
                  <Play className="mr-2 w-5 h-5" />
                  AGENDAR DEMO
                </Button>
              </div>
            </motion.div>

            {/* ObelixIA Logo with Brain */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
              className="flex justify-center mt-8"
            >
              <ObelixiaLogo size="hero" variant="full" animated />
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
