import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoContext } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { Clock, Database, User, X, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { DemoEndModal } from './DemoEndModal';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, demoRole, startedAt, dataStats, endDemo, isLoading, startTour, tourActive } = useDemoContext();
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [showEndModal, setShowEndModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!startedAt || !isDemoMode) return;

    const updateElapsed = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startedAt, isDemoMode]);

  if (!isDemoMode) return null;

  const roleLabels: Record<string, string> = {
    director_comercial: 'Director de Negoci',
    gestor: 'Gestor Comercial',
    superadmin: 'Administrador'
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-lg">
            <div className="container mx-auto">
              <div className="flex items-center justify-between py-2 px-4">
                {/* Left section */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-3 h-3 rounded-full bg-white"
                    />
                    <span className="font-bold text-sm uppercase tracking-wide">Modo Demo</span>
                  </div>
                  
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hidden md:flex items-center gap-4 text-sm"
                    >
                      <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded">
                        <User className="h-3.5 w-3.5" />
                        <span>{roleLabels[demoRole || ''] || demoRole}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{elapsedTime}</span>
                      </div>
                      {dataStats && (
                        <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded">
                          <Database className="h-3.5 w-3.5" />
                          <span>{dataStats.companies} empresas · {dataStats.visits} visitas</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Right section */}
                <div className="flex items-center gap-2">
                  {!tourActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={startTour}
                      className="text-white hover:bg-white/20 hidden sm:flex"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Ver Tour
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-white hover:bg-white/20 md:hidden"
                  >
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowEndModal(true)}
                    disabled={isLoading}
                    className="bg-white text-orange-600 hover:bg-white/90 font-medium"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Finalizar
                  </Button>
                </div>
              </div>

              {/* Mobile expanded info */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="md:hidden overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 px-4 pb-2 text-sm">
                      <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded">
                        <User className="h-3.5 w-3.5" />
                        <span>{roleLabels[demoRole || ''] || demoRole}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{elapsedTime}</span>
                      </div>
                      {dataStats && (
                        <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded">
                          <Database className="h-3.5 w-3.5" />
                          <span>{dataStats.companies} empresas</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <DemoEndModal open={showEndModal} onOpenChange={setShowEndModal} />
    </>
  );
};
