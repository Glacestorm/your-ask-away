/**
 * Dialog reutilizable para formularios de entidades
 */

import React, { memo, useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FormTab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
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
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFooter?: boolean;
  defaultTab?: string;
}

const sizeClasses = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[500px]',
  lg: 'sm:max-w-[700px]',
  xl: 'sm:max-w-[900px]'
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
  defaultTab
}: EntityFormDialogProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs?.[0]?.key || '');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  }, [onSubmit]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  }, [isSubmitting, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(sizeClasses[size], "max-h-[90vh] overflow-hidden flex flex-col")}>
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
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
                    <TabsTrigger key={tab.key} value={tab.key} className="gap-1">
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
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
            <DialogFooter className="shrink-0 pt-4 border-t mt-4">
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
  );
});

export default EntityFormDialog;
