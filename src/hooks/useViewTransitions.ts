/**
 * View Transitions API Hook
 * Provides smooth page transitions using the browser's View Transitions API
 * Falls back gracefully on unsupported browsers
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// === ERROR TIPADO KB ===
export interface ViewTransitionsError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface ViewTransitionOptions {
  skipTransition?: boolean;
  transitionName?: string;
}

interface UseViewTransitionsReturn {
  isSupported: boolean;
  isTransitioning: boolean;
  navigateWithTransition: (to: string, options?: ViewTransitionOptions) => void;
  startViewTransition: (callback: () => void | Promise<void>) => void;
  // === KB ADDITIONS ===
  error: ViewTransitionsError | null;
  lastRefresh: Date | null;
  clearError: () => void;
}

// Check if View Transitions API is supported
const isViewTransitionsSupported = (): boolean => {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
};

export function useViewTransitions(): UseViewTransitionsReturn {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isSupported = isViewTransitionsSupported();
  // === ESTADO KB ===
  const [error] = useState<ViewTransitionsError | null>(null);
  const [lastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => {}, []);

  // Add CSS for view transitions on mount
  useEffect(() => {
    if (!isSupported) return;

    // Inject view transition styles if not already present
    const styleId = 'view-transition-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* View Transitions API Styles */
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation-duration: 0.25s;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        ::view-transition-old(root) {
          animation-name: fade-out;
        }

        ::view-transition-new(root) {
          animation-name: fade-in;
        }

        @keyframes fade-out {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.98); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Slide transitions for specific elements */
        ::view-transition-old(page-content),
        ::view-transition-new(page-content) {
          animation-duration: 0.3s;
        }

        ::view-transition-old(page-content) {
          animation-name: slide-out;
        }

        ::view-transition-new(page-content) {
          animation-name: slide-in;
        }

        @keyframes slide-out {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-20px); }
        }

        @keyframes slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          ::view-transition-old(root),
          ::view-transition-new(root),
          ::view-transition-old(page-content),
          ::view-transition-new(page-content) {
            animation-duration: 0.01ms;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // Cleanup is optional - styles can persist
    };
  }, [isSupported]);

  const startViewTransition = useCallback((callback: () => void | Promise<void>) => {
    if (!isSupported) {
      // Fallback for unsupported browsers
      callback();
      return;
    }

    setIsTransitioning(true);
    
    // @ts-ignore - View Transitions API types
    const transition = document.startViewTransition(async () => {
      await callback();
    });

    transition.finished.finally(() => {
      setIsTransitioning(false);
    });
  }, [isSupported]);

  const navigateWithTransition = useCallback((
    to: string, 
    options: ViewTransitionOptions = {}
  ) => {
    const { skipTransition = false } = options;

    if (skipTransition || !isSupported) {
      navigate(to);
      return;
    }

    startViewTransition(() => {
      navigate(to);
    });
  }, [navigate, isSupported, startViewTransition]);

  return {
    isSupported,
    isTransitioning,
    navigateWithTransition,
    startViewTransition,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}

// Export type for external use
export type { ViewTransitionOptions, UseViewTransitionsReturn };
