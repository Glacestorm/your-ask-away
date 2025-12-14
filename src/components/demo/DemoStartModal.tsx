import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDemoContext, DemoRole } from '@/contexts/DemoContext';
import { Building2, User, Settings, Play, Clock, Database, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roles: { id: DemoRole; title: string; description: string; icon: React.ReactNode; features: string[] }[] = [
  {
    id: 'director_comercial',
    title: 'Director de Negoci',
    description: 'Vista ejecutiva completa con KPIs, métricas y control total del equipo comercial',
    icon: <Building2 className="h-8 w-8" />,
    features: ['Dashboard ejecutivo', 'Métricas globales', 'Gestión de equipos', 'Reportes avanzados']
  },
  {
    id: 'gestor',
    title: 'Gestor Comercial',
    description: 'Experiencia del día a día: visitas, empresas asignadas y objetivos personales',
    icon: <User className="h-8 w-8" />,
    features: ['Cartera de clientes', 'Planificación visitas', 'Fichas comerciales', 'Objetivos personales']
  },
  {
    id: 'superadmin',
    title: 'Administrador',
    description: 'Acceso completo a configuración, usuarios, productos y herramientas del sistema',
    icon: <Settings className="h-8 w-8" />,
    features: ['Configuración sistema', 'Gestión usuarios', 'Productos bancarios', 'Compliance']
  }
];

export const DemoStartModal: React.FC<DemoStartModalProps> = ({ open, onOpenChange }) => {
  const { startDemo, isLoading } = useDemoContext();
  const [selectedRole, setSelectedRole] = useState<DemoRole | null>(null);
  const [step, setStep] = useState<'select' | 'loading' | 'error'>('select');
  const [error, setError] = useState<string | null>(null);

  const handleStartDemo = async () => {
    if (!selectedRole) return;
    
    setStep('loading');
    setError(null);
    
    const success = await startDemo(selectedRole);
    
    if (success) {
      onOpenChange(false);
    } else {
      setStep('error');
      setError('No se pudo iniciar la demo. Por favor, inténtalo de nuevo.');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setStep('select');
      setSelectedRole(null);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border">
        <div className="relative">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 pb-4">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-bold">
                  Prueba ObelixIA
                </DialogTitle>
              </div>
              <DialogDescription className="text-base">
                Experimenta todas las funcionalidades del CRM bancario más avanzado con datos de demostración realistas.
              </DialogDescription>
            </DialogHeader>
          </div>

          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 pt-4"
              >
                {/* Info badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
                    <Clock className="h-4 w-4" />
                    <span>15-30 min</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
                    <Database className="h-4 w-4" />
                    <span>50 empresas, 100 visitas</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
                    <Shield className="h-4 w-4" />
                    <span>Datos ficticios aislados</span>
                  </div>
                </div>

                {/* Role selection */}
                <p className="text-sm font-medium text-foreground mb-3">Selecciona tu perfil de demostración:</p>
                <div className="grid gap-3">
                  {roles.map((role) => (
                    <motion.button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={cn(
                        "relative flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                        selectedRole === role.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className={cn(
                        "p-3 rounded-lg shrink-0",
                        selectedRole === role.id ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {role.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{role.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {role.features.map((feature) => (
                            <span
                              key={feature}
                              className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      {selectedRole === role.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        >
                          <ChevronRight className="h-4 w-4 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Start button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleStartDemo}
                    disabled={!selectedRole}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground gap-2"
                  >
                    <Play className="h-5 w-5" />
                    Iniciar Demo Gratuita
                  </Button>
                </div>

                {/* Disclaimer */}
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  Los datos mostrados son completamente ficticios y se eliminarán automáticamente al finalizar.
                </p>
              </motion.div>
            )}

            {step === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 flex flex-col items-center justify-center"
              >
                <div className="relative w-20 h-20 mb-6">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary/20"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Preparando tu demo...</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Generando 50 empresas, 100 visitas, objetivos y más datos realistas para tu experiencia.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Esto tardará unos segundos...</span>
                </div>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Error al iniciar demo</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">{error}</p>
                <Button onClick={() => setStep('select')} variant="outline">
                  Volver a intentar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
