/**
 * MinimalLayout - Layout mínimo sin navegación
 * Usado en: Auth, páginas de error, modales fullscreen, Subscription Success
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';

interface MinimalLayoutProps {
  children: ReactNode;
  /** Mostrar logo en la esquina */
  showLogo?: boolean;
  /** Link del logo (por defecto a /store) */
  logoLink?: string;
  /** Fondo personalizado */
  background?: 'default' | 'gradient' | 'dark' | 'transparent';
  /** Centrar contenido verticalmente */
  centerContent?: boolean;
  /** Clase adicional */
  className?: string;
}

export function MinimalLayout({
  children,
  showLogo = true,
  logoLink = '/store',
  background = 'default',
  centerContent = false,
  className = '',
}: MinimalLayoutProps) {
  const backgroundClasses = {
    default: 'bg-background',
    gradient: 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950',
    dark: 'bg-slate-950',
    transparent: 'bg-transparent',
  };

  return (
    <div
      className={`min-h-screen ${backgroundClasses[background]} ${
        centerContent ? 'flex flex-col items-center justify-center' : ''
      } ${className}`}
    >
      {/* Logo opcional */}
      {showLogo && (
        <div className="absolute top-4 left-4 z-50">
          <Link to={logoLink}>
            <ObelixiaLogo 
              size="sm" 
              variant="full" 
              animated={false} 
              dark={background === 'gradient' || background === 'dark'} 
            />
          </Link>
        </div>
      )}

      {/* Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={centerContent ? 'w-full max-w-lg px-4' : 'flex-1'}
      >
        {children}
      </motion.main>
    </div>
  );
}

export default MinimalLayout;
