import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Menu, X, UserPlus, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import StoreAuthModal from './StoreAuthModal';
import { useLanguage } from '@/contexts/LanguageContext';

const StoreNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const { itemCount, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('inicio');
  const { t } = useLanguage();

  const navLinks = [
    { id: 'inicio', label: t('store.nav.home') },
    { id: 'modules', label: t('store.nav.modules') },
    { id: 'bundles', label: t('store.nav.bundles') },
    { id: 'pricing', label: t('store.nav.pricing') },
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

  const openLogin = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-18">
            {/* Logo - Left */}
            <button onClick={() => scrollToSection('inicio')} className="flex items-center gap-2 z-10">
              <ObelixiaLogo size="md" variant="full" animated={false} dark />
              <span className="text-base font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent ml-1" style={{ fontFamily: 'Crimson Pro, serif' }}>
                Store
              </span>
            </button>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <motion.button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95, y: 1 }}
                  className={`
                    relative px-5 py-2.5 rounded-xl font-semibold text-base tracking-wide
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

            {/* Auth Buttons + Cart - Right */}
            <div className="hidden lg:flex items-center gap-7 z-10">
              {/* Login Button */}
              <motion.button
                onClick={openLogin}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95, y: 1 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-base tracking-wide bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 text-white shadow-[0_6px_20px_rgba(34,211,238,0.4)] hover:from-blue-400 hover:via-cyan-400 hover:to-emerald-400 hover:shadow-[0_8px_24px_rgba(34,211,238,0.5)] transition-all duration-300"
                style={{ fontFamily: 'Crimson Pro, serif', letterSpacing: '0.05em' }}
              >
                <LogIn className="w-5 h-5" />
                <span>{t('store.nav.login')}</span>
              </motion.button>

              {/* Register Button */}
              <motion.button
                onClick={openRegister}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95, y: 1 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-base tracking-wide bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 text-white shadow-[0_6px_20px_rgba(34,211,238,0.4)] hover:from-blue-400 hover:via-cyan-400 hover:to-emerald-400 hover:shadow-[0_8px_24px_rgba(34,211,238,0.5)] transition-all duration-300"
                style={{ fontFamily: 'Crimson Pro, serif', letterSpacing: '0.05em' }}
              >
                <UserPlus className="w-5 h-5" />
                <span>{t('store.nav.register')}</span>
              </motion.button>

              {/* Cart Button */}
              <motion.button
                onClick={() => setIsCartOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-3 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-[0_6px_20px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:from-emerald-400 hover:to-emerald-600 transition-all duration-300 ml-2"
              >
                <span className="absolute inset-0 rounded-xl animate-ping bg-emerald-400/40" style={{ animationDuration: '1.5s' }} />
                <span className="absolute inset-0 rounded-xl animate-pulse bg-emerald-400/30" style={{ animationDuration: '2s' }} />
                <ShoppingCart className="w-5 h-5 text-white relative z-10" />
                {itemCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-xs font-bold shadow-[0_2px_8px_rgba(34,211,238,0.6)] border-2 border-slate-950"
                  >
                    {itemCount}
                  </Badge>
                )}
              </motion.button>
            </div>

            {/* Mobile: Cart + Menu Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <motion.button
                onClick={() => setIsCartOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-lg"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 w-5 h-5 p-0 flex items-center justify-center bg-cyan-400 text-white text-xs font-bold">
                    {itemCount}
                  </Badge>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 shadow-lg text-slate-200"
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
              className="lg:hidden py-4 border-t border-slate-800"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <motion.button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      py-2.5 px-4 rounded-xl font-semibold text-left transition-all text-sm
                      ${activeSection === link.id
                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400'
                        : 'text-slate-300 hover:bg-slate-800/50'
                      }
                    `}
                    style={{ fontFamily: 'Crimson Pro, serif' }}
                  >
                    {link.label}
                  </motion.button>
                ))}
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
                <motion.button
                  onClick={openLogin}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 text-white shadow-lg text-sm"
                  style={{ fontFamily: 'Crimson Pro, serif' }}
                >
                  <LogIn className="w-4 h-4" />
                  {t('store.nav.login')}
                </motion.button>
                <motion.button
                  onClick={openRegister}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 text-white shadow-lg text-sm"
                  style={{ fontFamily: 'Crimson Pro, serif' }}
                >
                  <UserPlus className="w-4 h-4" />
                  {t('store.nav.register')}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <StoreAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
};

export default StoreNavbar;
