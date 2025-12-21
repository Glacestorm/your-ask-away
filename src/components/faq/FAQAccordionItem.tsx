import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FAQAccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  onFeedback?: (helpful: boolean) => void;
  helpfulCount?: number;
  viewsCount?: number;
  categoryColor?: string;
}

const FAQAccordionItem: React.FC<FAQAccordionItemProps> = ({
  question,
  answer,
  isOpen,
  onToggle,
  onFeedback,
  helpfulCount = 0,
  viewsCount = 0,
  categoryColor = 'emerald'
}) => {
  const colorClasses: Record<string, string> = {
    emerald: 'border-emerald-500/30 hover:border-emerald-500/50',
    blue: 'border-blue-500/30 hover:border-blue-500/50',
    purple: 'border-purple-500/30 hover:border-purple-500/50',
    orange: 'border-orange-500/30 hover:border-orange-500/50',
    pink: 'border-pink-500/30 hover:border-pink-500/50',
    red: 'border-red-500/30 hover:border-red-500/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border bg-slate-900/50 overflow-hidden transition-all duration-300",
        colorClasses[categoryColor] || colorClasses.emerald
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/30 transition-colors"
      >
        <span className="text-lg font-medium text-white pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 border-t border-slate-700/50">
              <p className="text-slate-300 leading-relaxed pt-4 whitespace-pre-wrap">
                {answer}
              </p>
              
              {/* Feedback & Stats */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/30">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {viewsCount} vistas
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    {helpfulCount} útil
                  </span>
                </div>
                
                {onFeedback && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400 mr-2">¿Te fue útil?</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFeedback(true);
                      }}
                      className="h-8 px-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Sí
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFeedback(false);
                      }}
                      className="h-8 px-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      No
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FAQAccordionItem;
