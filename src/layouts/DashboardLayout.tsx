/**
 * DashboardLayout - Layout para páginas de dashboard/admin
 * Incluye: GlobalNavHeader, navegación lateral opcional
 * Usado en: Dashboard, Admin, Profile, Home (logged in)
 */

import React, { ReactNode, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { user, loading } = useAuth();
  
  // Estado para navegación de historial
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyStack, setHistoryStack] = useState<string[]>([location.pathname]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyStack.length - 1;

  const handleGoBack = useCallback(() => {
    if (canGoBack) {
      setHistoryIndex((prev) => prev - 1);
      navigate(-1);
    }
  }, [canGoBack, navigate]);

  const handleGoForward = useCallback(() => {
    if (canGoForward) {
      setHistoryIndex((prev) => prev + 1);
      navigate(1);
    }
  }, [canGoForward, navigate]);

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
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
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
