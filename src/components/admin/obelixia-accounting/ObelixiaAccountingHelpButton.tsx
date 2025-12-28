/**
 * ObelixIA Accounting Help Button
 * Botón flotante para acceder al copilot
 * Fase 1: AI Accounting Copilot
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, X } from 'lucide-react';
import { ObelixiaAccountingCopilotPanel } from './ObelixiaAccountingCopilotPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ObelixiaAccountingHelpButtonProps {
  fiscalConfigId?: string;
  accountId?: string;
  entryId?: string;
  className?: string;
}

export function ObelixiaAccountingHelpButton({
  fiscalConfigId,
  accountId,
  entryId,
  className
}: ObelixiaAccountingHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={false}
                animate={{ scale: isHovered ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={() => setIsOpen(!isOpen)}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  size="lg"
                  className={cn(
                    "relative h-14 w-14 rounded-full shadow-lg transition-all duration-300",
                    "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
                    "border-2 border-white/20"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="h-6 w-6 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="open"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Sparkles className="h-6 w-6 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pulse animation */}
                  {!isOpen && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-violet-400/50"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut'
                      }}
                    />
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
              <p className="font-medium">ObelixIA Copilot</p>
              <p className="text-xs opacity-80">Asistente contable IA</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Dialog with Copilot Panel */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
          <ObelixiaAccountingCopilotPanel
            fiscalConfigId={fiscalConfigId}
            accountId={accountId}
            entryId={entryId}
            onClose={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ObelixiaAccountingHelpButton;
