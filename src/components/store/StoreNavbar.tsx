import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Menu, X } from 'lucide-react';
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Luxury Logo */}
          <Link to="/store" className="flex items-center gap-1">
            <ObelixiaLogo size="sm" variant="full" animated={false} dark />
            <span className="text-xs text-emerald-400 ml-1">Store</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`text-sm font-medium transition-colors ${
                  activeSection === link.id
                    ? 'text-emerald-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="h-0.5 bg-emerald-400 mt-1"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-300 hover:text-white"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-emerald-500 text-white text-xs"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>

            <Link to="/auth" className="hidden md:block">
              <Button 
                variant="outline" 
                size="sm"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Iniciar Sesión
              </Button>
            </Link>

            <button onClick={() => scrollToSection('modules')} className="hidden md:block">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                Comprar Ahora
              </Button>
            </button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-slate-800"
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`block py-2 text-sm font-medium ${
                  activeSection === link.id ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="flex gap-2 mt-4">
              <Link to="/auth" className="flex-1">
                <Button variant="outline" className="w-full">Iniciar Sesión</Button>
              </Link>
              <button onClick={() => scrollToSection('modules')} className="flex-1">
                <Button className="w-full bg-emerald-500">Comprar</Button>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default StoreNavbar;
