import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, UserPlus, LogIn, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import StoreAuthModal from './StoreAuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { headerNavigation, isRouteActive, type NavItem } from '@/config/navigation';

const StoreNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { itemCount, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

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
          <button
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200 ease-out
              ${isActive
                ? 'text-emerald-400'
                : 'text-slate-300 hover:text-white'
              }
            `}
          >
            {item.label}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1 min-w-[200px] bg-slate-900 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden z-50"
              >
                <div className="py-1">
                  {item.children?.map((child) => (
                    <Link
                      key={child.id}
                      to={child.href}
                      onClick={() => setOpenDropdown(null)}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 transition-colors duration-150
                        ${isRouteActive(location.pathname, child.href)
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }
                      `}
                    >
                      {child.icon && <child.icon className="w-4 h-4 text-slate-500" />}
                      <span className="text-sm">{child.label}</span>
                      {child.badge && (
                        <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0 border-0">
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
      <button
        key={item.id}
        onClick={() => handleNavigation(item.href)}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium
          transition-colors duration-200
          ${isActive
            ? 'text-emerald-400'
            : 'text-slate-300 hover:text-white'
          }
        `}
      >
        {item.label}
      </button>
    );
  };

  const renderMobileNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isRouteActive(location.pathname, item.href);
    const isOpen = openDropdown === item.id;

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => hasChildren ? setOpenDropdown(isOpen ? null : item.id) : handleNavigation(item.href)}
          className={`
            w-full flex items-center justify-between py-3 px-4 rounded-lg text-left transition-colors text-sm font-medium
            ${isActive ? 'text-emerald-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}
          `}
        >
          <span>{item.label}</span>
          {hasChildren && <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
        </button>
        
        <AnimatePresence>
          {hasChildren && isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pl-4 border-l border-slate-700 ml-4 py-1 space-y-1">
                {item.children?.map((child) => (
                  <Link
                    key={child.id}
                    to={child.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      flex items-center gap-2 py-2 px-3 rounded-lg text-sm
                      ${isRouteActive(location.pathname, child.href)
                        ? 'text-emerald-400'
                        : 'text-slate-400 hover:text-white'
                      }
                    `}
                  >
                    {child.icon && <child.icon className="w-4 h-4" />}
                    {child.label}
                    {child.badge && (
                      <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0 border-0">
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
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/store" className="flex-shrink-0">
              <ObelixiaLogo size="md" variant="full" animated={false} dark />
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex items-center gap-1 ml-12">
              {headerNavigation.map(renderNavItem)}
            </div>

            {/* Auth + Cart - Right */}
            <div className="hidden lg:flex items-center gap-3 ml-auto">
              <button
                onClick={openLogin}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {t('store.nav.login')}
              </button>

              <button
                onClick={openRegister}
                className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors"
              >
                {t('store.nav.register')}
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-300 hover:text-white transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile: Cart + Menu */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-300"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>

              <button
                className="p-2 text-slate-300"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-900 border-t border-slate-800"
            >
              <div className="container mx-auto px-4 py-4 space-y-1">
                {headerNavigation.map(renderMobileNavItem)}
                
                <div className="pt-4 mt-4 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={openLogin}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {t('store.nav.login')}
                  </button>
                  <button
                    onClick={openRegister}
                    className="flex-1 py-2.5 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors"
                  >
                    {t('store.nav.register')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <StoreAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
};

export default StoreNavbar;
