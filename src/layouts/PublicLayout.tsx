/**
 * PublicLayout - Layout para páginas públicas
 * Incluye: Navbar principal, Footer, y componentes globales
 * Usado en: Store, Sectores, Marketing, Company, Legal, Resources
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MainNavbar, MainFooter } from '@/components/navigation';
import CartSidebar from '@/components/store/CartSidebar';

interface PublicLayoutProps {
  children: ReactNode;
  /** Ocultar navbar (ej: para páginas con hero fullscreen) */
  hideNavbar?: boolean;
  /** Ocultar footer */
  hideFooter?: boolean;
  /** Clase adicional para el contenedor principal */
  className?: string;
  /** Fondo oscuro estilo store */
  darkBackground?: boolean;
  /** Padding top para compensar navbar fijo */
  navbarPadding?: boolean;
}

export function PublicLayout({
  children,
  hideNavbar = false,
  hideFooter = false,
  className = '',
  darkBackground = true,
  navbarPadding = true,
}: PublicLayoutProps) {
  const baseClassName = darkBackground
    ? 'min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
    : 'min-h-screen bg-background';

  return (
    <div className={`${baseClassName} ${className}`}>
      {/* Navbar */}
      {!hideNavbar && <MainNavbar />}

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex-1 ${navbarPadding && !hideNavbar ? 'pt-24' : ''}`}
      >
        {children}
      </motion.main>

      {/* Footer */}
      {!hideFooter && <MainFooter />}

      {/* Cart Sidebar - Siempre disponible en páginas públicas */}
      <CartSidebar />
    </div>
  );
}

export default PublicLayout;
