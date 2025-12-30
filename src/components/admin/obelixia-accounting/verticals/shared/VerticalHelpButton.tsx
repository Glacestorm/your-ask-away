/**
 * VerticalHelpButton
 * Botón flotante de ayuda para módulos verticales
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, X } from 'lucide-react';
import { VerticalCopilotPanel } from './VerticalCopilotPanel';
import { type VerticalType } from '@/hooks/admin/obelixia-accounting/useVerticalCopilot';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VerticalHelpButtonProps {
  verticalType: VerticalType;
  className?: string;
  accentColor?: string;
}

// Colores por vertical
const VERTICAL_COLORS: Record<VerticalType, string> = {
  agriculture: 'from-green-500 to-emerald-600',
  education: 'from-blue-500 to-indigo-600',
  healthcare: 'from-red-500 to-rose-600',
  hospitality: 'from-amber-500 to-orange-600',
  legal: 'from-slate-500 to-gray-600',
  energy: 'from-yellow-500 to-amber-600',
  construction: 'from-orange-500 to-red-600',
  manufacturing: 'from-purple-500 to-violet-600',
  logistics: 'from-cyan-500 to-blue-600',
  real_estate: 'from-teal-500 to-emerald-600',
  retail: 'from-pink-500 to-rose-600',
  ngo: 'from-indigo-500 to-purple-600',
  crypto: 'from-violet-500 to-purple-600',
  ai_marketplace: 'from-fuchsia-500 to-pink-600',
  predictive_cashflow: 'from-emerald-500 to-teal-600'
};

export function VerticalHelpButton({ 
  verticalType, 
  className,
  accentColor 
}: VerticalHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const color = accentColor || VERTICAL_COLORS[verticalType];

  return (
    <>
      {/* Floating Button */}
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                  "rounded-full shadow-lg transition-all duration-300",
                  `bg-gradient-to-r ${color} hover:shadow-xl`,
                  isOpen ? "w-12 h-12" : "h-12",
                  isHovered && !isOpen ? "px-4" : "w-12"
                )}
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                    >
                      <X className="h-5 w-5 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sparkles"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-5 w-5 text-white" />
                      {isHovered && (
                        <motion.span
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 'auto', opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="text-white font-medium whitespace-nowrap overflow-hidden"
                        >
                          Copilot
                        </motion.span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isOpen ? 'Cerrar asistente' : 'Abrir ObelixIA Copilot'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Pulse animation */}
        {!isOpen && (
          <>
            <span className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-20",
              `bg-gradient-to-r ${color}`
            )} />
            <span className={cn(
              "absolute inset-0 rounded-full animate-pulse opacity-30",
              `bg-gradient-to-r ${color}`
            )} style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className={cn(
            "p-0 gap-0 overflow-hidden transition-all duration-300",
            isExpanded 
              ? "max-w-4xl h-[90vh]" 
              : "max-w-md h-[600px]"
          )}
        >
          <DialogTitle className="sr-only">ObelixIA Copilot</DialogTitle>
          <VerticalCopilotPanel
            verticalType={verticalType}
            onClose={() => setIsOpen(false)}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
            accentColor={color}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
