/**
 * ObelixIA Accounting Help Button
 * Botón flotante para acceder al copilot
 * Fase 1: AI Accounting Copilot
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, X } from 'lucide-react';
import { ObelixiaAccountingCopilotPanel } from './ObelixiaAccountingCopilotPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Floating Button - Top Right aligned with tabs */}
      <div className={cn("flex items-center", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={false}
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={() => setIsOpen(!isOpen)}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className={cn(
                    "relative h-10 px-4 gap-2 rounded-lg shadow-lg transition-all duration-300",
                    "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
                    "border border-white/20 text-white font-medium"
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
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        <span>Cerrar</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="open"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Copilot</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pulse animation */}
                  {!isOpen && (
                    <motion.span
                      className="absolute inset-0 rounded-lg bg-violet-400/30"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.1, opacity: 0 }}
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
            <TooltipContent side="bottom" className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0">
              <p className="font-medium">ObelixIA Copilot</p>
              <p className="text-xs opacity-80">Asistente contable IA</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Dialog with Copilot Panel */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className={cn(
            "p-0 gap-0 overflow-hidden transition-all duration-300",
            isExpanded 
              ? "sm:max-w-[90vw] sm:max-h-[90vh] w-[90vw] h-[90vh]" 
              : "sm:max-w-[520px] sm:max-h-[700px] w-[520px] h-[680px]"
          )}
          aria-describedby="copilot-description"
        >
          <VisuallyHidden>
            <DialogTitle>ObelixIA Copilot - Asistente Contable</DialogTitle>
            <DialogDescription id="copilot-description">
              Asistente de inteligencia artificial para contabilidad y gestión fiscal
            </DialogDescription>
          </VisuallyHidden>
          <ObelixiaAccountingCopilotPanel
            fiscalConfigId={fiscalConfigId}
            accountId={accountId}
            entryId={entryId}
            onClose={() => setIsOpen(false)}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ObelixiaAccountingHelpButton;
