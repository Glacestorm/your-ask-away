import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';

const StoreNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { itemCount, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = React.useState('inicio');

  const navLinks = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'modules', label: 'Módulos' },
    { id: 'bundles', label: 'Packs' },
    { id: 'pricing', label: 'Precios' },
  ];

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/store') {
      navigate('/store');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setActiveSection(sectionId);
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-between h-20">
          {/* Luxury Logo - Left */}
          <Link to="/store" className="flex items-center gap-2 z-10">
            <ObelixiaLogo size="md" variant="full" animated={false} dark />
            <span className="text-base font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent ml-1" style={{ fontFamily: 'Crimson Pro, serif' }}>
              Store
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <motion.button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95, y: 1 }}
                className={`
                  relative px-6 py-3 rounded-xl font-semibold text-base tracking-wide
                  transition-all duration-300 ease-out
                  ${activeSection === link.id
                    ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_6px_20px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]'
                    : 'bg-gradient-to-b from-slate-700 to-slate-800 text-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:from-slate-600 hover:to-slate-700 hover:text-white hover:shadow-[0_6px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]'
                  }
                `}
                style={{ fontFamily: 'Crimson Pro, serif', letterSpacing: '0.05em' }}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.span
                    layoutId="nav-glow"
                    className="absolute inset-0 rounded-xl bg-emerald-400/20 blur-md -z-10"
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Actions - Right */}
          <div className="flex items-center gap-4 z-10">
            {/* Login Button - 3D */}
            <Link to="/auth" className="hidden md:block">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95, y: 1 }}
                className="px-6 py-3 rounded-xl font-semibold text-base tracking-wide bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_6px_20px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:from-blue-400 hover:to-blue-600 hover:shadow-[0_8px_24px_rgba(59,130,246,0.5)] transition-all duration-300"
                style={{ fontFamily: 'Crimson Pro, serif', letterSpacing: '0.05em' }}
              >
                Iniciar Sesión
              </motion.button>
            </Link>

            {/* CTA Button - 3D Premium */}
            <motion.button
              onClick={() => scrollToSection('modules')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 1 }}
              className="hidden md:flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-base tracking-wide bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 text-white shadow-[0_6px_24px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-3px_6px_rgba(0,0,0,0.2)] hover:from-emerald-300 hover:via-emerald-400 hover:to-emerald-600 hover:shadow-[0_8px_32px_rgba(16,185,129,0.6)] transition-all duration-300"
              style={{ fontFamily: 'Crimson Pro, serif', letterSpacing: '0.05em' }}
            >
              <Sparkles className="w-5 h-5" />
              Comprar Ahora
            </motion.button>

            {/* Cart Button with Pulse - Far Right */}
            <motion.button
              onClick={() => setIsCartOpen(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-3.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-[0_6px_20px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:from-emerald-400 hover:to-emerald-600 transition-all duration-300"
            >
              {/* Constant Pulse rings */}
              <span className="absolute inset-0 rounded-xl animate-ping bg-emerald-400/40" style={{ animationDuration: '1.5s' }} />
              <span className="absolute inset-0 rounded-xl animate-pulse bg-emerald-400/30" style={{ animationDuration: '2s' }} />
              <ShoppingCart className="w-6 h-6 text-white relative z-10" />
              {itemCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-xs font-bold shadow-[0_2px_8px_rgba(34,211,238,0.6)] border-2 border-slate-950"
                >
                  {itemCount}
                </Badge>
              )}
            </motion.button>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="md:hidden p-3 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] text-slate-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-6 border-t border-slate-800"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <motion.button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    py-3 px-4 rounded-xl font-semibold text-left transition-all
                    ${activeSection === link.id
                      ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]'
                      : 'text-slate-300 hover:bg-slate-800/50'
                    }
                  `}
                  style={{ fontFamily: 'Crimson Pro, serif' }}
                >
                  {link.label}
                </motion.button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <Link to="/auth" className="flex-1">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_4px_16px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]"
                  style={{ fontFamily: 'Crimson Pro, serif' }}
                >
                  Iniciar Sesión
                </motion.button>
              </Link>
              <motion.button
                onClick={() => scrollToSection('modules')}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]"
                style={{ fontFamily: 'Crimson Pro, serif' }}
              >
                Comprar
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default StoreNavbar;
