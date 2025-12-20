import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, UserPlus, LogIn, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import StoreAuthModal from './StoreAuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { mainNavigation, isRouteActive, type NavItem } from '@/config/navigation';

const StoreNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { itemCount, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Links rápidos para la Store (secciones en la misma página)
  const storeQuickLinks = [
    { id: 'inicio', label: t('store.nav.home'), href: '/store' },
    { id: 'modules', label: t('store.nav.modules'), href: '/store/modules' },
    { id: 'bundles', label: t('store.nav.bundles'), href: '/store#bundles' },
    { id: 'pricing', label: t('store.nav.pricing'), href: '/precios' },
  ];

  const handleNavigation = (href: string) => {
    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      if (location.pathname !== path && path) {
        navigate(path);
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const element = document.getElementById(hash);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
    setIsMenuOpen(false);
    setOpenDropdown(null);
  };

  const openLogin = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isRouteActive(location.pathname, item.href);
    const isOpen = openDropdown === item.id;

    if (hasChildren) {
      return (
        <div 
          key={item.id}
          className="relative"
          onMouseEnter={() => setOpenDropdown(item.id)}
          onMouseLeave={() => setOpenDropdown(null)}
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm tracking-wide
              transition-all duration-300 ease-out
              ${isActive
                ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_6px_20px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-b from-slate-700 to-slate-800 text-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:from-slate-600 hover:to-slate-700 hover:text-white'
              }
            `}
            style={{ fontFamily: 'Crimson Pro, serif' }}
          >
            {item.icon && <item.icon className="w-4 h-4" />}
            {item.label}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 min-w-[220px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-2">
                  {item.children?.map((child) => (
                    <Link
                      key={child.id}
                      to={child.href}
                      onClick={() => setOpenDropdown(null)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${isRouteActive(location.pathname, child.href)
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }
                      `}
                    >
                      {child.icon && <child.icon className="w-4 h-4 text-emerald-400" />}
                      <span className="font-medium text-sm">{child.label}</span>
                      {child.badge && (
                        <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs border-0">
                          {child.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <motion.button
        key={item.id}
        onClick={() => handleNavigation(item.href)}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className={`
          flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm tracking-wide
          transition-all duration-300 ease-out
          ${isActive
            ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_6px_20px_rgba(16,185,129,0.4)]'
            : 'bg-gradient-to-b from-slate-700 to-slate-800 text-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:from-slate-600 hover:to-slate-700 hover:text-white'
          }
        `}
        style={{ fontFamily: 'Crimson Pro, serif' }}
      >
        {item.icon && <item.icon className="w-4 h-4" />}
        {item.label}
      </motion.button>
    );
  };

  const renderMobileNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isRouteActive(location.pathname, item.href);

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => hasChildren ? setOpenDropdown(openDropdown === item.id ? null : item.id) : handleNavigation(item.href)}
          className={`
            w-full flex items-center justify-between py-2.5 px-4 rounded-xl font-semibold text-left transition-all text-sm
            ${isActive
              ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400'
              : 'text-slate-300 hover:bg-slate-800/50'
            }
          `}
          style={{ fontFamily: 'Crimson Pro, serif', paddingLeft: `${1 + depth}rem` }}
        >
          <span className="flex items-center gap-2">
            {item.icon && <item.icon className="w-4 h-4" />}
            {item.label}
          </span>
          {hasChildren && <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.id ? 'rotate-180' : ''}`} />}
        </button>
        
        {hasChildren && openDropdown === item.id && (
          <div className="pl-4 border-l border-slate-700/50 ml-4 mt-1 space-y-1">
            {item.children?.map((child) => renderMobileNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <nav className="fixed top-4 left-0 right-0 z-50 bg-transparent">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-19">
            {/* Logo - Left */}
            <Link to="/store" className="flex items-center gap-2 z-10">
              <ObelixiaLogo size="md" variant="full" animated={false} dark />
              <span className="text-base font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent ml-1" style={{ fontFamily: 'Crimson Pro, serif' }}>
                Store
              </span>
            </Link>

            {/* Desktop Navigation - Center: Links rápidos + Menús con dropdown */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Quick Store Links */}
              {storeQuickLinks.map((link) => (
                <motion.button
                  key={link.id}
                  onClick={() => handleNavigation(link.href)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    px-4 py-2.5 rounded-xl font-semibold text-sm tracking-wide
                    transition-all duration-300 ease-out
                    ${isRouteActive(location.pathname, link.href)
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_6px_20px_rgba(16,185,129,0.4)]'
                      : 'bg-gradient-to-b from-slate-700 to-slate-800 text-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:from-slate-600 hover:to-slate-700 hover:text-white'
                    }
                  `}
                  style={{ fontFamily: 'Crimson Pro, serif' }}
                >
                  {link.label}
                </motion.button>
              ))}

              {/* Separator */}
              <div className="w-px h-6 bg-slate-600/50 mx-1" />

              {/* Main Navigation Dropdowns */}
              {mainNavigation.filter(n => n.id !== 'store').map(renderNavItem)}
            </div>

            {/* Auth Buttons + Cart - Right */}
            <div className="hidden lg:flex items-center gap-4 z-10">
              {/* Login Button */}
              <motion.button
                onClick={openLogin}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm tracking-wide bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 text-white shadow-[0_6px_20px_rgba(34,211,238,0.4)] hover:from-blue-400 hover:via-cyan-400 hover:to-emerald-400 transition-all duration-300"
                style={{ fontFamily: 'Crimson Pro, serif' }}
              >
                <LogIn className="w-4 h-4" />
                <span>{t('store.nav.login')}</span>
              </motion.button>

              {/* Register Button */}
              <motion.button
                onClick={openRegister}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm tracking-wide bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 text-white shadow-[0_6px_20px_rgba(34,211,238,0.4)] hover:from-blue-400 hover:via-cyan-400 hover:to-emerald-400 transition-all duration-300"
                style={{ fontFamily: 'Crimson Pro, serif' }}
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('store.nav.register')}</span>
              </motion.button>

              {/* Cart Button */}
              <motion.button
                onClick={() => setIsCartOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-[0_6px_20px_rgba(16,185,129,0.4)] hover:from-emerald-400 hover:to-emerald-600 transition-all duration-300"
              >
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
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden py-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl rounded-b-xl mt-2"
              >
                {/* Quick Store Links */}
                <div className="px-2 mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider px-4 mb-2">Store</p>
                  {storeQuickLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => handleNavigation(link.href)}
                      className={`
                        w-full py-2.5 px-4 rounded-xl font-semibold text-left transition-all text-sm
                        ${isRouteActive(location.pathname, link.href)
                          ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400'
                          : 'text-slate-300 hover:bg-slate-800/50'
                        }
                      `}
                      style={{ fontFamily: 'Crimson Pro, serif' }}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                {/* All Navigation */}
                <div className="px-2 border-t border-slate-800 pt-3 space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider px-4 mb-2">Navegación</p>
                  {mainNavigation.filter(n => n.id !== 'store').map((item) => renderMobileNavItem(item))}
                </div>
                
                {/* Auth Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800 px-2">
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
          </AnimatePresence>
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
