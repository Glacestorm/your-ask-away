/**
 * MainNavbar - Navbar principal unificado
 * Usa la configuración de navigation.ts para todos los menús
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Menu, 
  X, 
  UserPlus, 
  LogIn, 
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import StoreAuthModal from '@/components/store/StoreAuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { mainNavigation, isRouteActive, type NavItem } from '@/config/navigation';

const MainNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const { itemCount, setIsCartOpen } = useCart();
  const { user, signOut, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const openLogin = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/store');
  };

  const getKnownBadgeLabel = (badge?: string) => {
    if (!badge) return undefined;
    if (badge === 'Nuevo') return t('badge.new');
    if (badge === 'IA') return t('badge.ai');
    return badge;
  };

  const getLabel = (item: NavItem) => {
    if (item.labelKey) return t(item.labelKey);
    return item.label;
  };

  const getDescription = (item: NavItem) => {
    if (item.descriptionKey) {
      const translated = t(item.descriptionKey);
      return translated !== item.descriptionKey ? translated : item.description;
    }
    return item.description;
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = isRouteActive(location.pathname, item.href);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <DropdownMenu
          key={item.id}
          open={openDropdown === item.id}
          onOpenChange={(open) => setOpenDropdown(open ? item.id : null)}
        >
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }
              `}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              <span>{getLabel(item)}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${openDropdown === item.id ? 'rotate-180' : ''}`}
              />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700 p-2" sideOffset={8}>
            {item.children!.map((child) => {
              const desc = getDescription(child);
              const badgeLabel = getKnownBadgeLabel(child.badge);

              return (
                <DropdownMenuItem key={child.id} asChild>
                  <Link
                    to={child.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    {child.icon && <child.icon className="w-4 h-4 text-emerald-400" />}
                    <div className="flex-1">
                      <span className="font-medium">{getLabel(child)}</span>
                      {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
                    </div>
                    {badgeLabel && (
                      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-xs">
                        {badgeLabel}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const badgeLabel = getKnownBadgeLabel(item.badge);

    return (
      <Link key={item.id} to={item.href}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm
            transition-all duration-200
            ${
              isActive
                ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }
          `}
        >
          {item.icon && <item.icon className="w-4 h-4" />}
          <span>{getLabel(item)}</span>
          {badgeLabel && (
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-xs ml-1">
              {badgeLabel}
            </Badge>
          )}
        </motion.div>
      </Link>
    );
  };

  const renderMobileNavItem = (item: NavItem, level = 0) => {
    const isActive = isRouteActive(location.pathname, item.href);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <Link
          to={item.href !== '#' ? item.href : '#'}
          onClick={() => {
            if (item.href !== '#') setIsMenuOpen(false);
          }}
          className={`
            flex items-center gap-3 py-2.5 px-4 rounded-xl font-medium text-sm
            transition-all
            ${level > 0 ? 'ml-4 text-slate-400' : ''}
            ${isActive
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-300 hover:bg-slate-800/50'
            }
          `}
        >
          {item.icon && <item.icon className="w-4 h-4" />}
          <span>{item.labelKey ? t(item.labelKey) : item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-xs">
              {item.badge}
            </Badge>
          )}
        </Link>
        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderMobileNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <nav className="fixed top-4 left-0 right-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 px-4">
            {/* Logo */}
            <Link to="/store" className="flex items-center gap-2">
              <ObelixiaLogo size="md" variant="full" animated={false} dark />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {mainNavigation.map(renderNavItem)}
            </div>

            {/* Right Section: Auth + Cart */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Admin Link - Solo visible para superadmin */}
              {user && isSuperAdmin && (
                <Link to="/obelixia-admin">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"
                    title={t('admin.title')}
                  >
                    <Shield className="w-5 h-5 text-white" />
                  </motion.div>
                </Link>
              )}

              {user ? (
                // Usuario logueado
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-slate-900 border-slate-700" align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" />
                        {t('menu.dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        {t('menu.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-400 cursor-pointer">
                      <LogOut className="w-4 h-4" />
                      {t('menu.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Usuario no logueado
                <>
                  <motion.button
                    onClick={openLogin}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t('store.nav.login')}</span>
                  </motion.button>

                  <motion.button
                    onClick={openRegister}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg hover:shadow-emerald-500/25 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t('store.nav.register')}</span>
                  </motion.button>
                </>
              )}

              {/* Cart */}
              <motion.button
                onClick={() => setIsCartOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-lg"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 w-5 h-5 p-0 flex items-center justify-center bg-cyan-400 text-white text-xs font-bold">
                    {itemCount}
                  </Badge>
                )}
              </motion.button>
            </div>

            {/* Mobile: Cart + Menu Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <motion.button
                onClick={() => setIsCartOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300"
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
                className="lg:hidden mt-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
              >
                <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                  {mainNavigation.map((item) => renderMobileNavItem(item))}
                  
                  {/* Auth buttons mobile */}
                  <div className="pt-4 mt-4 border-t border-slate-700 space-y-2">
                      {user ? (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-slate-300 hover:bg-slate-800/50"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t('menu.dashboard')}
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center gap-3 py-2.5 px-4 rounded-xl text-red-400 hover:bg-slate-800/50 w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('menu.logout')}
                        </button>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            openLogin();
                            setIsMenuOpen(false);
                          }}
                          variant="outline"
                          className="flex-1 border-slate-700 text-slate-300"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          {t('store.nav.login')}
                        </Button>
                        <Button
                          onClick={() => {
                            openRegister();
                            setIsMenuOpen(false);
                          }}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {t('store.nav.register')}
                        </Button>
                      </div>
                    )}
                  </div>
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

export default MainNavbar;
