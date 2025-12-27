/**
 * DashboardLayout - Layout para páginas de dashboard/admin
 * Incluye: GlobalNavHeader, navegación lateral opcional
 * Usado en: Dashboard, Admin, Profile, Home (logged in)
 */

import React, { ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlobalNavHeader } from '@/components/GlobalNavHeader';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
  /** Título del header */
  title?: string;
  /** Subtítulo del header */
  subtitle?: string;
  /** Mostrar navegación de historial (atrás/adelante) */
  showHistoryNav?: boolean;
  /** Clase adicional para el contenedor principal */
  className?: string;
  /** Padding del contenido */
  contentPadding?: 'none' | 'sm' | 'md' | 'lg';
  /** Acciones junto al título */
  titleActions?: ReactNode;
  /** Slot derecho del header */
  rightSlot?: ReactNode;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  showHistoryNav = true,
  className = '',
  contentPadding = 'md',
  titleActions,
  rightSlot,
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Use browser's native history - canGoBack is true if there's history to go back to
  // We check if window.history.length > 1 as a simple heuristic
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;
  const canGoForward = false; // Browser doesn't expose forward history state reliably

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleGoForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-2 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  // Si está cargando auth, mostrar skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-full" />
          <div className="w-32 h-4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 p-2 md:p-4">
        <GlobalNavHeader
          title={title}
          subtitle={subtitle}
          canGoBack={showHistoryNav && canGoBack}
          canGoForward={showHistoryNav && canGoForward}
          onGoBack={showHistoryNav ? handleGoBack : undefined}
          onGoForward={showHistoryNav ? handleGoForward : undefined}
          titleActions={titleActions}
          rightSlot={rightSlot}
        />
      </div>

      {/* Main Content - Optimized transition for faster perceived navigation */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        className={`flex-1 ${paddingClasses[contentPadding]}`}
      >
        {children}
      </motion.main>
    </div>
  );
}

export default DashboardLayout;
