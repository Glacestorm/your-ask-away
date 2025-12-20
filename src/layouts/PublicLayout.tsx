/**
 * PublicLayout - Layout para páginas públicas
 * Incluye: Navbar principal, Footer, y componentes globales
 * Usado en: Store, Sectores, Marketing, Company, Legal, Resources
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import StoreNavbar from '@/components/store/StoreNavbar';
import StoreFooter from '@/components/store/StoreFooter';
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
}

export function PublicLayout({
  children,
  hideNavbar = false,
  hideFooter = false,
  className = '',
  darkBackground = true,
}: PublicLayoutProps) {
  const baseClassName = darkBackground
    ? 'min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
    : 'min-h-screen bg-background';

  return (
    <div className={`${baseClassName} ${className}`}>
      {/* Navbar */}
      {!hideNavbar && <StoreNavbar />}

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1"
      >
        {children}
      </motion.main>

      {/* Footer */}
      {!hideFooter && <StoreFooter />}

      {/* Cart Sidebar - Siempre disponible en páginas públicas */}
      <CartSidebar />
    </div>
  );
}

export default PublicLayout;
