import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Menu, X, ChevronDown, ArrowRight,
  Package, Boxes, DollarSign, Landmark, ShieldCheck, ShoppingBag, Factory,
  Store, Code, BarChart3, MessageSquare, BookOpen, Rocket
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import StoreAuthModal from './StoreAuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import MegaMenu, { type MegaMenuSection } from '@/components/navigation/MegaMenu';

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
  const { t } = useLanguage();

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
      label: 'Productos',
      megaMenu: {
        sections: [
          {
            title: 'Catálogo',
            items: [
              { id: 'modules', label: 'Módulos', href: '/store/modules', icon: Package, description: 'Explora todos los módulos disponibles' },
              { id: 'bundles', label: 'Packs', href: '/store#bundles', icon: Boxes, description: 'Soluciones completas a mejor precio' },
              { id: 'pricing', label: 'Precios', href: '/precios', icon: DollarSign, description: 'Planes y tarifas transparentes' },
            ],
          },
          {
            title: 'Plataforma',
            items: [
              { id: 'marketplace', label: 'Marketplace', href: '/marketplace', icon: Store, description: 'Extensiones y conectores', badge: 'Nuevo' },
              { id: 'chat', label: 'Chat IA', href: '/chat', icon: MessageSquare, description: 'Asistente inteligente integrado', badge: 'IA' },
              { id: 'cdp', label: 'CDP Analytics', href: '/cdp', icon: BarChart3, description: 'Análisis de datos en tiempo real' },
            ],
          },
        ],
        featured: {
          title: 'Configurador de Soluciones',
          description: 'Diseña tu plataforma ideal con nuestro asistente interactivo',
          href: '/demo',
        },
      },
    },
    {
      id: 'soluciones',
      label: 'Soluciones',
      megaMenu: {
        sections: [
          {
            title: 'Por Sector',
            items: [
              { id: 'banca', label: 'Banca', href: '/sectores/banca', icon: Landmark, description: 'CRM bancario con cumplimiento normativo' },
              { id: 'seguros', label: 'Seguros', href: '/sectores/seguros', icon: ShieldCheck, description: 'Gestión integral de pólizas y siniestros' },
              { id: 'retail', label: 'Retail', href: '/sectores/retail', icon: ShoppingBag, description: 'Omnicanalidad y experiencia de cliente' },
              { id: 'manufactura', label: 'Manufactura', href: '/sectores/manufactura', icon: Factory, description: 'Producción y cadena de suministro' },
            ],
          },
        ],
        featured: {
          title: 'Casos de Éxito',
          description: 'Descubre cómo otras empresas han transformado su negocio',
          href: '/cases',
        },
      },
    },
    {
      id: 'desarrolladores',
      label: 'Desarrolladores',
      megaMenu: {
        sections: [
          {
            title: 'Recursos',
            items: [
              { id: 'docs', label: 'Documentación', href: '/docs', icon: BookOpen, description: 'Guías y tutoriales completos' },
              { id: 'api', label: 'API Reference', href: '/api', icon: Code, description: 'Referencia técnica de la API' },
              { id: 'developer-portal', label: 'Portal Dev', href: '/developers', icon: Rocket, description: 'Herramientas para desarrolladores' },
            ],
          },
        ],
      },
    },
    {
      id: 'empresa',
      label: 'Empresa',
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
          isScrolled 
            ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-slate-100' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/store" className="flex-shrink-0 relative z-10">
              <ObelixiaLogo size="md" variant="full" animated={false} dark={!isScrolled} />
            </Link>

            {/* Desktop Navigation */}
            <div 
              className="hidden lg:flex items-center gap-1"
              onMouseEnter={cancelDesktopClose}
              onMouseLeave={() => scheduleDesktopClose()}
            >
              {navItems.map((item) => (
                <div
                  key={item.id}
                  onMouseEnter={() => {
                    cancelDesktopClose();
                    if (item.megaMenu) setActiveMenu(item.id);
                    else setActiveMenu(null);
                  }}
                >
                  {item.megaMenu ? (
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isScrolled 
                          ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                          : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMenu === item.id ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link
                      to={item.href || '#'}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isScrolled 
                          ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                          : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
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
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  isScrolled 
                    ? 'text-slate-700 hover:text-slate-900'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>

              <button
                onClick={openRegister}
                className="px-5 py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 text-white rounded-full transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
              >
                Comenzar Gratis
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2.5 rounded-full transition-colors duration-200 ${
                  isScrolled
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 ${isScrolled ? 'text-slate-700' : 'text-white'}`}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>

              <button
                className={`p-2 ${isScrolled ? 'text-slate-700' : 'text-white'}`}
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
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={openRegister}
                    className="w-full py-3 text-center font-medium bg-primary text-white rounded-full hover:bg-primary/90"
                  >
                    Comenzar Gratis
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
