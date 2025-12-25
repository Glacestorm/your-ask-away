/**
 * StreamingMessage - Componente para mostrar mensajes con streaming token-by-token
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
  role: 'user' | 'assistant';
  className?: string;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  isStreaming,
  role,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3",
        role === 'user' ? "justify-end" : "justify-start",
        className
      )}
    >
      {role === 'assistant' && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[85%] rounded-lg p-3",
        role === 'user' 
          ? "bg-primary text-primary-foreground" 
          : "bg-slate-800"
      )}>
        <div className={cn(
          "text-sm whitespace-pre-wrap",
          role === 'assistant' && "text-slate-200 prose prose-sm prose-invert max-w-none"
        )}>
          {content}
          {isStreaming && role === 'assistant' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-primary ml-1 align-middle"
            />
          )}
        </div>
        
        {isStreaming && !content && role === 'assistant' && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-slate-400">Pensando...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StreamingMessage;
