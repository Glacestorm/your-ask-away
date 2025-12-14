import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDemoContext } from '@/contexts/DemoContext';
import { Clock, Building2, CalendarDays, Target, CheckCircle, Loader2, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoEndModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DemoEndModal: React.FC<DemoEndModalProps> = ({ open, onOpenChange }) => {
  const { endDemo, isLoading, startedAt, dataStats, demoRole } = useDemoContext();
  const [step, setStep] = useState<'confirm' | 'cleaning' | 'done'>('confirm');
  const navigate = useNavigate();

  const [elapsedTime, setElapsedTime] = useState('0 minutos');

  useEffect(() => {
    if (startedAt) {
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000 / 60);
      setElapsedTime(`${elapsed} minuto${elapsed !== 1 ? 's' : ''}`);
    }
  }, [startedAt, open]);

  const handleEndDemo = async () => {
    setStep('cleaning');
    await endDemo();
    setStep('done');
  };

  const handleClose = () => {
    if (step === 'done') {
      navigate('/');
      window.location.reload();
    }
    onOpenChange(false);
    setStep('confirm');
  };

  const roleLabels: Record<string, string> = {
    director_comercial: 'Director de Negoci',
    gestor: 'Gestor Comercial',
    superadmin: 'Administrador'
  };

  return (
    <Dialog open={open} onOpenChange={step === 'cleaning' ? undefined : handleClose}>
      <DialogContent className="max-w-md">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Finalizar Demo</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres terminar la demostración?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Session summary */}
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm text-foreground">Resumen de tu sesión</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{elapsedTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">{roleLabels[demoRole || '']}</span>
                  </div>
                  {dataStats && (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{dataStats.companies} empresas</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>{dataStats.visits} visitas</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>{dataStats.goals} objetivos</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Todos los datos de demostración serán eliminados automáticamente. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Continuar Demo
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleEndDemo}
                disabled={isLoading}
              >
                Finalizar y Limpiar
              </Button>
            </div>
          </>
        )}

        {step === 'cleaning' && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Limpiando datos...</h3>
            <p className="text-sm text-muted-foreground text-center">
              Eliminando empresas, visitas, objetivos y todos los datos de demostración.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
            >
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </motion.div>
            
            <h3 className="text-xl font-semibold mb-2">¡Gracias por probar ObelixIA!</h3>
            <p className="text-muted-foreground text-center mb-6">
              Todos los datos de demostración han sido eliminados correctamente.
            </p>

            {/* Contact CTA */}
            <div className="w-full bg-muted rounded-lg p-4 mb-6">
              <h4 className="font-medium mb-2 text-center">¿Interesado en ObelixIA?</h4>
              <p className="text-sm text-muted-foreground text-center mb-3">
                Contáctanos para una demostración personalizada
              </p>
              <div className="flex flex-col gap-2">
                <a 
                  href="mailto:comercial@obelixia.com" 
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  comercial@obelixia.com
                </a>
                <a 
                  href="tel:+376123456" 
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  +376 123 456
                </a>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Volver al inicio
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
