/**
 * Dialog reutilizable para formularios de entidades
 * @version 2.0 - Mejoras: Validación visual, confirmación de cierre, mejor a11y
 */

import React, { memo, useCallback, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FormTab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  hasErrors?: boolean;
  errorCount?: number;
}

export interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  tabs?: FormTab[];
  children?: React.ReactNode;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showFooter?: boolean;
  defaultTab?: string;
  isDirty?: boolean;
  confirmClose?: boolean;
  confirmCloseMessage?: string;
}

const sizeClasses = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[500px]',
  lg: 'sm:max-w-[700px]',
  xl: 'sm:max-w-[900px]',
  full: 'sm:max-w-[95vw] sm:h-[90vh]'
};

export const EntityFormDialog = memo(function EntityFormDialog({
  open,
  onOpenChange,
  title,
  description,
  tabs,
  children,
  onSubmit,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  isSubmitting = false,
  size = 'md',
  showFooter = true,
  defaultTab,
  isDirty = false,
  confirmClose = true,
  confirmCloseMessage = '¿Descartar los cambios sin guardar?'
}: EntityFormDialogProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs?.[0]?.key || '');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Reset tab when dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab || tabs?.[0]?.key || '');
    }
  }, [open, defaultTab, tabs]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  }, [onSubmit]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    
    if (confirmClose && isDirty) {
      setShowConfirmClose(true);
    } else {
      onOpenChange(false);
    }
  }, [isSubmitting, confirmClose, isDirty, onOpenChange]);

  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // Navigate to first tab with errors
  const tabsWithErrors = tabs?.filter(t => t.hasErrors) || [];
  const goToFirstError = useCallback(() => {
    if (tabsWithErrors.length > 0) {
      setActiveTab(tabsWithErrors[0].key);
    }
  }, [tabsWithErrors]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent 
          className={cn(
            sizeClasses[size], 
            "max-h-[90vh] overflow-hidden flex flex-col"
          )}
          onPointerDownOutside={(e) => {
            if (isDirty) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isDirty) {
              e.preventDefault();
              handleClose();
            }
          }}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {title}
              {isDirty && (
                <Badge variant="outline" className="text-xs font-normal">
                  Sin guardar
                </Badge>
              )}
            </DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-auto px-1">
              {tabs && tabs.length > 0 ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className={cn(
                    "grid w-full shrink-0",
                    tabs.length === 2 && "grid-cols-2",
                    tabs.length === 3 && "grid-cols-3",
                    tabs.length === 4 && "grid-cols-4",
                    tabs.length >= 5 && "grid-cols-5"
                  )}>
                    {tabs.map((tab) => (
                      <TabsTrigger 
                        key={tab.key} 
                        value={tab.key} 
                        className={cn(
                          "gap-1 relative",
                          tab.hasErrors && "text-destructive"
                        )}
                      >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.hasErrors && tab.errorCount && (
                          <Badge 
                            variant="destructive" 
                            className="h-4 w-4 p-0 flex items-center justify-center text-[10px] absolute -top-1 -right-1"
                          >
                            {tab.errorCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="flex-1 overflow-auto mt-4">
                    <AnimatePresence mode="wait">
                      {tabs.map((tab) => (
                        activeTab === tab.key && (
                          <TabsContent key={tab.key} value={tab.key} className="mt-0 h-full" forceMount>
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="space-y-4"
                            >
                              {tab.content}
                            </motion.div>
                          </TabsContent>
                        )
                      ))}
                    </AnimatePresence>
                  </div>
                </Tabs>
              ) : (
                <div className="space-y-4 py-2">
                  {children}
                </div>
              )}
            </div>

            {showFooter && (
              <DialogFooter className="shrink-0 pt-4 border-t mt-4 gap-2">
                {tabsWithErrors.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={goToFirstError}
                    className="mr-auto text-destructive hover:text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {tabsWithErrors.length} error{tabsWithErrors.length > 1 ? 'es' : ''}
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  {cancelLabel}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {submitLabel}
                </Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCloseMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

export default EntityFormDialog;
