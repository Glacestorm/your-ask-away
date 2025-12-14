import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoContext } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { Clock, Database, User, X, Play, ChevronLeft, ChevronRight, Building2, Calendar, Target, Bell } from 'lucide-react';
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
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          exit={{ x: -100 }}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50"
        >
          {/* Vertical sidebar demo panel */}
          <div className="bg-gradient-to-b from-amber-500 via-orange-500 to-amber-500 text-white shadow-2xl rounded-r-xl overflow-hidden">
            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-6 top-1/2 -translate-y-1/2 bg-orange-500 text-white p-1.5 rounded-r-lg shadow-lg hover:bg-orange-600 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <AnimatePresence mode="wait">
              {!isCollapsed ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 flex flex-col gap-4 min-w-[200px]"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 border-b border-white/20 pb-3">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-3 h-3 rounded-full bg-white shadow-lg"
                    />
                    <span className="font-bold text-sm uppercase tracking-wide">Demo Activa</span>
                  </div>

                  {/* Role */}
                  <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-2 rounded-lg">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{roleLabels[demoRole || ''] || demoRole}</span>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-2 rounded-lg">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono text-lg">{elapsedTime}</span>
                  </div>

                  {/* Stats */}
                  {dataStats && (
                    <div className="space-y-2">
                      <p className="text-xs text-white/70 uppercase tracking-wide">Datos Demo</p>
                      <div className="grid gap-2 text-xs">
                        <div className="flex items-center gap-2 bg-white/15 px-2 py-1.5 rounded">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{dataStats.companies} empresas</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/15 px-2 py-1.5 rounded">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{dataStats.visits} visitas</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/15 px-2 py-1.5 rounded">
                          <Target className="h-3.5 w-3.5" />
                          <span>{dataStats.goals} objetivos</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/15 px-2 py-1.5 rounded">
                          <Bell className="h-3.5 w-3.5" />
                          <span>{dataStats.notifications} notificaciones</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
                    {!tourActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={startTour}
                        className="text-white hover:bg-white/20 justify-start"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Ver Tour
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowEndModal(true)}
                      disabled={isLoading}
                      className="bg-white text-orange-600 hover:bg-white/90 font-medium justify-start"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Finalizar Demo
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-2 flex flex-col items-center gap-3"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-3 h-3 rounded-full bg-white shadow-lg"
                  />
                  <span className="text-xs font-bold writing-mode-vertical rotate-180" style={{ writingMode: 'vertical-rl' }}>
                    DEMO
                  </span>
                  <div className="text-xs font-mono">{elapsedTime}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      <DemoEndModal open={showEndModal} onOpenChange={setShowEndModal} />
    </>
  );
};
