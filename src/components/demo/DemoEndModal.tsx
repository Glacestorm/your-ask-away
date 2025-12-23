import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDemoContext } from '@/contexts/DemoContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Building2, CalendarDays, Target, CheckCircle, Loader2, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoEndModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DemoEndModal: React.FC<DemoEndModalProps> = ({ open, onOpenChange }) => {
  const { endDemo, isLoading, startedAt, dataStats, demoRole } = useDemoContext();
  const { t } = useLanguage();
  const [step, setStep] = useState<'confirm' | 'cleaning' | 'done'>('confirm');
  const navigate = useNavigate();

  const [elapsedTime, setElapsedTime] = useState('0');

  useEffect(() => {
    if (startedAt) {
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000 / 60);
      setElapsedTime(String(elapsed));
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
    }
    onOpenChange(false);
    setStep('confirm');
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'director_comercial':
        return t('demo.role.director');
      case 'gestor':
        return t('demo.role.gestor');
      case 'superadmin':
        return t('demo.role.admin');
      default:
        return role || '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={step === 'cleaning' ? undefined : handleClose}>
      <DialogContent className="max-w-md">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{t('demo.endTitle')}</DialogTitle>
              <DialogDescription>
                {t('demo.endConfirm')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Session summary */}
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm text-foreground">{t('demo.sessionSummary')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{elapsedTime} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">{getRoleLabel(demoRole)}</span>
                  </div>
                  {dataStats && (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{dataStats.companies} {t('demo.companies')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>{dataStats.visits} {t('demo.visits')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>{dataStats.goals} {t('demo.goals')}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {t('demo.willDelete')}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('demo.continueDemo')}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleEndDemo}
                disabled={isLoading}
              >
                {t('demo.endAndClean')}
              </Button>
            </div>
          </>
        )}

        {step === 'cleaning' && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('demo.cleaning')}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {t('demo.cleaningDesc')}
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
            
            <h3 className="text-xl font-semibold mb-2">{t('demo.thankYou')}</h3>
            <p className="text-muted-foreground text-center mb-6">
              {t('demo.dataDeleted')}
            </p>

            {/* Contact CTA */}
            <div className="w-full bg-muted rounded-lg p-4 mb-6">
              <h4 className="font-medium mb-2 text-center">{t('demo.interested')}</h4>
              <p className="text-sm text-muted-foreground text-center mb-3">
                {t('demo.contactUs')}
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-center text-muted-foreground">
                  Sr. Jaime FERNANDEZ GARCIA - Representante y Cofundador
                </p>
                <a 
                  href="mailto:jfernandez@obelixia.com" 
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  jfernandez@obelixia.com
                </a>
                <a 
                  href="tel:+34606770033" 
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  +34 606 770 033
                </a>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              {t('demo.backToHome')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};