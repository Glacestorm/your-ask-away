/**
 * HelpTooltip - Componente de ayuda contextual con burbujas informativas
 */

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, Info, AlertCircle, Lightbulb, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HelpType = 'info' | 'tip' | 'warning' | 'regulation' | 'definition';

interface HelpTooltipProps {
  content: React.ReactNode;
  title?: string;
  type?: HelpType;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
  regulationRef?: string;
  children?: React.ReactNode;
}

const helpTypeConfig: Record<HelpType, { icon: React.ElementType; color: string; bgColor: string }> = {
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
  },
  tip: {
    icon: Lightbulb,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
  },
  warning: {
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
  },
  regulation: {
    icon: BookOpen,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800'
  },
  definition: {
    icon: HelpCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800'
  }
};

export function HelpTooltip({
  content,
  title,
  type = 'info',
  side = 'top',
  className,
  iconClassName,
  regulationRef,
  children
}: HelpTooltipProps) {
  const config = helpTypeConfig[type];
  const Icon = config.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center rounded-full p-0.5 transition-colors',
                'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                className
              )}
            >
              <Icon className={cn('h-4 w-4', config.color, iconClassName)} />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn(
            'max-w-sm p-3 border shadow-lg',
            config.bgColor
          )}
        >
          <div className="space-y-2">
            {title && (
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Icon className={cn('h-4 w-4', config.color)} />
                <span>{title}</span>
              </div>
            )}
            <div className="text-sm text-muted-foreground leading-relaxed">
              {content}
            </div>
            {regulationRef && (
              <div className="pt-1 border-t border-border/50">
                <span className="text-xs text-muted-foreground/70">
                  Ref: {regulationRef}
                </span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente para agrupar múltiples tooltips de ayuda
interface HelpLabelProps {
  label: string;
  helpContent: React.ReactNode;
  helpTitle?: string;
  helpType?: HelpType;
  required?: boolean;
  className?: string;
}

export function HelpLabel({
  label,
  helpContent,
  helpTitle,
  helpType = 'info',
  required,
  className
}: HelpLabelProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <HelpTooltip
        content={helpContent}
        title={helpTitle}
        type={helpType}
      />
    </div>
  );
}

export default HelpTooltip;
