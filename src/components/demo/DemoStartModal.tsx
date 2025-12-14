import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDemoContext, DemoRole } from '@/contexts/DemoContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, User, Settings, Play, Clock, Database, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DemoStartModal: React.FC<DemoStartModalProps> = ({ open, onOpenChange }) => {
  const { startDemo, isLoading } = useDemoContext();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<DemoRole | null>(null);
  const [step, setStep] = useState<'select' | 'loading' | 'error'>('select');
  const [error, setError] = useState<string | null>(null);

  const roles: { id: DemoRole; titleKey: string; descKey: string; icon: React.ReactNode; featureKeys: string[] }[] = [
    {
      id: 'director_comercial',
      titleKey: 'demo.role.director',
      descKey: 'demo.role.director.desc',
      icon: <Building2 className="h-8 w-8" />,
      featureKeys: ['demo.role.director.feat1', 'demo.role.director.feat2', 'demo.role.director.feat3', 'demo.role.director.feat4']
    },
    {
      id: 'gestor',
      titleKey: 'demo.role.gestor',
      descKey: 'demo.role.gestor.desc',
      icon: <User className="h-8 w-8" />,
      featureKeys: ['demo.role.gestor.feat1', 'demo.role.gestor.feat2', 'demo.role.gestor.feat3', 'demo.role.gestor.feat4']
    },
    {
      id: 'superadmin',
      titleKey: 'demo.role.admin',
      descKey: 'demo.role.admin.desc',
      icon: <Settings className="h-8 w-8" />,
      featureKeys: ['demo.role.admin.feat1', 'demo.role.admin.feat2', 'demo.role.admin.feat3', 'demo.role.admin.feat4']
    }
  ];

  const handleStartDemo = async () => {
    if (!selectedRole) return;
    
    setStep('loading');
    setError(null);
    
    const success = await startDemo(selectedRole);
    
    if (success) {
      onOpenChange(false);
    } else {
      setStep('error');
      setError(t('demo.couldNotStart'));
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
                  {t('demo.title')}
                </DialogTitle>
              </div>
              <DialogDescription className="text-base">
                {t('demo.subtitle')}
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
                    <span>{t('demo.duration')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
                    <Database className="h-4 w-4" />
                    <span>{t('demo.dataCount')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
                    <Shield className="h-4 w-4" />
                    <span>{t('demo.dataIsolated')}</span>
                  </div>
                </div>

                {/* Role selection */}
                <p className="text-sm font-medium text-foreground mb-3">{t('demo.selectProfile')}</p>
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
                        <h3 className="font-semibold text-foreground">{t(role.titleKey)}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{t(role.descKey)}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {role.featureKeys.map((featureKey) => (
                            <span
                              key={featureKey}
                              className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
                            >
                              {t(featureKey)}
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
                    {t('demo.startFree')}
                  </Button>
                </div>

                {/* Disclaimer */}
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  {t('demo.disclaimer')}
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
                <h3 className="text-xl font-semibold mb-2">{t('demo.preparing')}</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  {t('demo.generatingData')}
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{t('demo.waitSeconds')}</span>
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
                <h3 className="text-xl font-semibold mb-2">{t('demo.errorTitle')}</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">{error}</p>
                <Button onClick={() => setStep('select')} variant="outline">
                  {t('demo.errorRetry')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};