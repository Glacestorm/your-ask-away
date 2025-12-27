import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Menu, X, ChevronDown, ArrowRight,
  Package, Boxes, DollarSign, Landmark, ShieldCheck, ShoppingBag, Factory,
  Store, Code, BarChart3, MessageSquare, BookOpen, Rocket,
  Heart, Users, GraduationCap, Globe, CreditCard, Briefcase, Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import StoreAuthModal from './StoreAuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import MegaMenu, { type MegaMenuSection } from '@/components/navigation/MegaMenu';
import { useRoutePreload } from '@/hooks/useRoutePreload';

interface NavMenuItem {
  id: string;
  label: string;
  href?: string;
  megaMenu?: {
    sections: MegaMenuSection[];
    featured?: {
      title: string;
      description: string;
      href: string;
    };
  };
}

const StoreNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const { itemCount, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { preloadRoute } = useRoutePreload();
  
  // Define all pages that use dark theme navbar (internal pages with dark background)
  const darkThemeRoutes = [
    '/store/modules',
    '/store/checkout',
    '/sectores',
    '/developers',
    '/academia',
    '/chat',
    '/precios',
    '/docs',
    '/api',
    '/blog',
    '/marketplace',
    '/cdp',
    '/demo',
    '/cases',
    '/about',
  ];
  
  // Check if current path is an internal page (not main store landing)
  const isInternalPage = location.pathname !== '/store' && (
    location.pathname.startsWith('/store/') ||
    darkThemeRoutes.some(route => location.pathname.startsWith(route))
  );
  
  // Determine if navbar should have solid background
  const hasSolidBackground = isScrolled || isInternalPage;
  
  // Use dark theme (white text) for internal pages, light theme (dark text) when scrolled on main store
  const useDarkTheme = isInternalPage || !isScrolled;

  const cancelDesktopClose = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleDesktopClose = (delay = 140) => {
    cancelDesktopClose();
    closeTimeoutRef.current = window.setTimeout(() => {
      setActiveMenu(null);
    }, delay);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelDesktopClose();
    };
  }, []);

  // Navigation structure with mega menus
  const navItems: NavMenuItem[] = [
    {
      id: 'productos',
      label: t('nav.products'),
      href: '/store',
      megaMenu: {
        sections: [
          {
            title: t('nav.catalog'),
            items: [
              { id: 'modules', label: t('nav.modules'), href: '/store/modules', icon: Package, description: t('nav.modules.desc') },
              { id: 'bundles', label: t('nav.bundles'), href: '/store#bundles', icon: Boxes, description: t('nav.bundles.desc') },
              { id: 'pricing', label: t('nav.pricing'), href: '/precios', icon: DollarSign, description: t('nav.pricing.desc') },
              { id: 'paquetes', label: language === 'es' ? 'Paquetes CRM/ERP' : language === 'ca' ? 'Paquets CRM/ERP' : 'CRM/ERP Packages', href: '/paquetes', icon: Boxes, description: language === 'es' ? 'Solo CRM, Solo ERP o Suite Completa' : language === 'ca' ? 'Només CRM, Només ERP o Suite Completa' : 'CRM Only, ERP Only or Complete Suite', badge: language === 'es' ? 'Nuevo' : language === 'ca' ? 'Nou' : 'New' },
            ],
          },
          {
            title: t('nav.platform'),
            items: [
              { id: 'marketplace', label: t('nav.marketplace'), href: '/marketplace', icon: Store, description: t('nav.marketplace.desc'), badge: t('badge.new') },
              { id: 'chat', label: t('nav.chat'), href: '/chat', icon: MessageSquare, description: t('nav.chat.desc'), badge: t('badge.ai') },
              { id: 'cdp', label: t('nav.cdp'), href: '/cdp', icon: BarChart3, description: t('nav.cdp.desc') },
            ],
          },
        ],
        featured: {
          title: t('nav.featured.configurator'),
          description: t('nav.featured.configurator.desc'),
          href: '/demo',
        },
      },
    },
    {
      id: 'academia',
      label: language === 'es' ? 'Academia' : 'Academy',
      href: '/academia',
      megaMenu: {
        sections: [
          {
            title: language === 'es' ? 'Formación' : 'Training',
            items: [
              { id: 'cursos', label: language === 'es' ? 'Todos los Cursos' : 'All Courses', href: '/academia/cursos', icon: BookOpen, description: language === 'es' ? 'Catálogo completo de formación' : 'Complete training catalog' },
              { id: 'certificaciones', label: language === 'es' ? 'Certificaciones' : 'Certifications', href: '/academia/cursos?type=certification', icon: Award, description: language === 'es' ? 'Programas certificados oficiales' : 'Official certified programs', badge: 'Pro' },
              { id: 'webinars', label: 'Webinars', href: '/academia/cursos?type=webinar', icon: Globe, description: language === 'es' ? 'Sesiones en vivo y grabadas' : 'Live and recorded sessions' },
              { id: 'demo', label: language === 'es' ? 'Demo Academia' : 'Academy Demo', href: '/academia/demo', icon: Rocket, description: language === 'es' ? 'Prueba interactiva de la plataforma' : 'Interactive platform demo', badge: language === 'es' ? 'Nuevo' : 'New' },
            ],
          },
          {
            title: language === 'es' ? 'Mi Espacio' : 'My Space',
            items: [
              { id: 'mi-perfil', label: language === 'es' ? 'Mi Perfil' : 'My Profile', href: '/academia/mi-perfil', icon: Users, description: language === 'es' ? 'Logros, certificados y progreso' : 'Achievements, certificates and progress' },
              { id: 'notificaciones', label: language === 'es' ? 'Notificaciones' : 'Notifications', href: '/academia/notificaciones', icon: MessageSquare, description: language === 'es' ? 'Alertas y actualizaciones' : 'Alerts and updates', badge: language === 'es' ? 'Nuevo' : 'New' },
              { id: 'comunidad', label: language === 'es' ? 'Comunidad' : 'Community', href: '/academia/comunidad', icon: Users, description: language === 'es' ? 'Foros y discusiones' : 'Forums and discussions', badge: language === 'es' ? 'Nuevo' : 'New' },
              { id: 'verificar', label: language === 'es' ? 'Verificar Certificado' : 'Verify Certificate', href: '/academia/verificar', icon: ShieldCheck, description: language === 'es' ? 'Valida autenticidad de certificados' : 'Validate certificate authenticity' },
            ],
          },
          {
            title: language === 'es' ? 'Administración' : 'Administration',
            items: [
              { id: 'analytics', label: language === 'es' ? 'Analytics' : 'Analytics', href: '/academia/analytics', icon: BarChart3, description: language === 'es' ? 'Métricas y estadísticas de aprendizaje' : 'Learning metrics and statistics', badge: 'Pro' },
              { id: 'gestion-cursos', label: language === 'es' ? 'Gestión de Cursos' : 'Course Management', href: '/academia/gestion-cursos', icon: Briefcase, description: language === 'es' ? 'Administrar contenido educativo' : 'Manage educational content', badge: 'Admin' },
            ],
          },
          {
            title: language === 'es' ? 'Por Nivel' : 'By Level',
            items: [
              { id: 'basico', label: language === 'es' ? 'Básico' : 'Basic', href: '/academia/cursos?level=beginner', icon: Rocket, description: language === 'es' ? 'Empieza desde cero' : 'Start from scratch' },
              { id: 'intermedio', label: language === 'es' ? 'Intermedio' : 'Intermediate', href: '/academia/cursos?level=intermediate', icon: BarChart3, description: language === 'es' ? 'Profundiza tus conocimientos' : 'Deepen your knowledge' },
              { id: 'avanzado', label: language === 'es' ? 'Avanzado' : 'Advanced', href: '/academia/cursos?level=advanced', icon: Code, description: language === 'es' ? 'Domina las técnicas expertas' : 'Master expert techniques' },
            ],
          },
        ],
        featured: {
          title: language === 'es' ? 'Ruta de Aprendizaje' : 'Learning Path',
          description: language === 'es' ? 'Descubre tu camino personalizado hacia la maestría en CRM con IA' : 'Discover your personalized path to CRM mastery with AI',
          href: '/academia',
        },
      },
    },
    {
      id: 'soluciones',
      label: t('nav.solutions'),
      href: '/sectores',
      megaMenu: {
        sections: [
          {
            title: t('nav.finances'),
            items: [
              { id: 'banca', label: t('nav.banking'), href: '/sectores/banca', icon: Landmark, description: t('nav.banking.desc') },
              { id: 'seguros', label: t('nav.insurance'), href: '/sectores/seguros', icon: ShieldCheck, description: t('nav.insurance.desc') },
            ],
          },
          {
            title: t('nav.commerce'),
            items: [
              { id: 'retail', label: t('nav.retail'), href: '/sectores/retail', icon: ShoppingBag, description: t('nav.retail.desc') },
              { id: 'ecommerce', label: t('nav.ecommerce'), href: '/sectores/ecommerce', icon: Globe, description: t('nav.ecommerce.desc') },
              { id: 'suscripciones', label: t('nav.subscriptions'), href: '/sectores/suscripciones', icon: CreditCard, description: t('nav.subscriptions.desc') },
            ],
          },
          {
            title: t('nav.industry'),
            items: [
              { id: 'manufactura', label: t('nav.manufacturing'), href: '/sectores/manufactura', icon: Factory, description: t('nav.manufacturing.desc') },
              { id: 'salud', label: t('nav.health'), href: '/sectores/salud', icon: Heart, description: t('nav.health.desc') },
              { id: 'educacion', label: t('nav.education'), href: '/sectores/educacion', icon: GraduationCap, description: t('nav.education.desc') },
            ],
          },
          {
            title: t('nav.services'),
            items: [
              { id: 'agencias', label: t('nav.agencies'), href: '/sectores/agencias', icon: Briefcase, description: t('nav.agencies.desc') },
              { id: 'infoproductores', label: t('nav.infoproducers'), href: '/sectores/infoproductores', icon: Users, description: t('nav.infoproducers.desc') },
            ],
          },
        ],
        featured: {
          title: t('nav.featured.cases'),
          description: t('nav.featured.cases.desc'),
          href: '/cases',
        },
      },
    },
    {
      id: 'desarrolladores',
      label: t('nav.developers'),
      href: '/developers',
      megaMenu: {
        sections: [
          {
            title: t('nav.resources'),
            items: [
              { id: 'docs', label: t('nav.documentation'), href: '/docs', icon: BookOpen, description: t('nav.documentation.desc') },
              { id: 'api', label: t('nav.api'), href: '/api', icon: Code, description: t('nav.api.desc') },
              { id: 'developer-portal', label: t('nav.devportal'), href: '/developers', icon: Rocket, description: t('nav.devportal.desc') },
              { id: 'blog', label: t('nav.blog'), href: '/blog', icon: BookOpen, description: t('nav.blog.desc'), badge: t('badge.ai') },
            ],
          },
        ],
      },
    },
    {
      id: 'empresa',
      label: t('nav.company'),
      href: '/about',
    },
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
    setActiveMenu(null);
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
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          hasSolidBackground
            ? isInternalPage 
              ? 'bg-slate-900/95 backdrop-blur-lg shadow-sm border-b border-slate-800'
              : 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/store" className="flex-shrink-0 relative z-10">
              <ObelixiaLogo size="md" variant="full" animated={false} dark={useDarkTheme} />
            </Link>

            {/* Desktop Navigation */}
            <div 
              className="hidden lg:flex items-center justify-center gap-1 h-full pt-2"
              onMouseEnter={cancelDesktopClose}
              onMouseLeave={() => scheduleDesktopClose()}
            >
              {navItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center h-full"
                  onMouseEnter={() => {
                    cancelDesktopClose();
                    if (item.megaMenu) setActiveMenu(item.id);
                    else setActiveMenu(null);
                    // Precargar la ruta al hacer hover para navegación más rápida
                    if (item.href) preloadRoute(item.href);
                  }}
                >
                  {item.megaMenu ? (
                    <div className={`flex items-center h-full rounded-xl transition-all duration-200 ${
                      useDarkTheme 
                        ? 'hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)]'
                        : 'hover:bg-slate-100 hover:shadow-md'
                    }`}>
                      {/* Texto que navega */}
                      <Link
                        to={item.href || '#'}
                        className={`pl-5 pr-2 py-2.5 text-base font-semibold transition-all duration-200 ${
                          useDarkTheme 
                            ? 'text-white/95 hover:text-white'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                        style={{ textShadow: useDarkTheme ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}
                      >
                        {item.label}
                      </Link>
                      {/* Chevron que abre/cierra el menú */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === item.id ? null : item.id);
                        }}
                        className={`pr-3 pl-1 py-2.5 transition-all duration-200 ${
                          useDarkTheme 
                            ? 'text-white/70 hover:text-white'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                        aria-label={`Abrir menú de ${item.label}`}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMenu === item.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  ) : (
                    <Link
                      to={item.href || '#'}
                      onMouseEnter={() => item.href && preloadRoute(item.href)}
                      className={`px-5 py-2.5 rounded-xl text-base font-semibold transition-all duration-200 ${
                        useDarkTheme 
                          ? 'text-white/95 hover:text-white hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)] hover:-translate-y-0.5'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                      style={{ textShadow: useDarkTheme ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Mega Menu - Rendered outside nav items for proper positioning */}
            <AnimatePresence>
              {(() => {
                const item = activeMenu ? navItems.find((i) => i.id === activeMenu) : undefined;
                if (!item?.megaMenu) return null;

                return (
                  <div
                    className="absolute top-full left-0 right-0 z-50"
                    onMouseEnter={cancelDesktopClose}
                    onMouseLeave={() => scheduleDesktopClose()}
                  >
                    <MegaMenu
                      sections={item.megaMenu.sections}
                      featured={item.megaMenu.featured}
                      onClose={() => setActiveMenu(null)}
                    />
                  </div>
                );
              })()}
            </AnimatePresence>

            {/* Right Section */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={openLogin}
                className={`px-5 py-2.5 text-base font-semibold rounded-xl transition-all duration-200 border ${
                  useDarkTheme 
                    ? 'text-white border-white/30 hover:bg-white/10 hover:border-white/50 hover:-translate-y-0.5'
                    : 'text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400 hover:-translate-y-0.5'
                }`}
              >
                {t('nav.login')}
              </button>

              <button
                onClick={openRegister}
                className="px-6 py-2.5 text-base font-semibold bg-gradient-to-b from-primary via-primary to-primary/85 text-white rounded-xl transition-all duration-200 
                  shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.5),0_2px_4px_-2px_hsl(var(--primary)/0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
                  hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.6),0_3px_6px_-2px_hsl(var(--primary)/0.5),inset_0_1px_0_rgba(255,255,255,0.25)]
                  hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
              >
                {t('nav.register')}
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative p-3.5 rounded-xl transition-all duration-200 ${
                  useDarkTheme
                    ? 'text-white/95 hover:bg-white/10 hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)] hover:-translate-y-0.5'
                    : 'text-slate-700 hover:bg-slate-100 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <ShoppingCart className="w-6 h-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-full shadow-lg">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2.5 ${useDarkTheme ? 'text-white' : 'text-slate-700'}`}
              >
                <ShoppingCart className="w-6 h-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>

              <button
                className={`p-2 ${useDarkTheme ? 'text-white' : 'text-slate-700'}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
              className="lg:hidden bg-white border-t border-slate-100"
            >
              <div className="container mx-auto px-6 py-6 space-y-4">
                {navItems.map((item) => (
                  <div key={item.id}>
                    {item.megaMenu ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                          className="w-full flex items-center justify-between py-3 text-lg font-medium text-slate-900"
                        >
                          {item.label}
                          <ChevronDown className={`w-5 h-5 transition-transform ${activeMenu === item.id ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {activeMenu === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-4 pb-4 space-y-3">
                                {item.megaMenu.sections.map((section, idx) => (
                                  <div key={idx}>
                                    {section.title && (
                                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        {section.title}
                                      </p>
                                    )}
                                    {section.items.map((subItem) => (
                                      <Link
                                        key={subItem.id}
                                        to={subItem.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 py-2 text-slate-600 hover:text-slate-900"
                                      >
                                        {subItem.icon && <subItem.icon className="w-5 h-5" />}
                                        <span>{subItem.label}</span>
                                        {subItem.badge && (
                                          <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 border-0">
                                            {subItem.badge}
                                          </Badge>
                                        )}
                                      </Link>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        to={item.href || '#'}
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-3 text-lg font-medium text-slate-900"
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}

                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  <button
                    onClick={openLogin}
                    className="w-full py-3 text-center font-medium text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50"
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={openRegister}
                    className="w-full py-3 text-center font-medium bg-primary text-white rounded-full hover:bg-primary/90"
                  >
                    {t('nav.register')}
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
