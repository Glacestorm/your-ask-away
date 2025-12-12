import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PriorityCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  children: React.ReactNode;
  className?: string;
}

export function PriorityCard({
  title,
  subtitle,
  icon,
  priority = 'medium',
  children,
  className,
}: PriorityCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        // Priority-based mobile ordering (handled via CSS order)
        priority === 'high' && 'order-1 sm:order-none',
        priority === 'medium' && 'order-2 sm:order-none',
        priority === 'low' && 'order-3 sm:order-none',
        className
      )}
    >
      {(title || icon) && (
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            {icon}
            <span>{title}</span>
          </CardTitle>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(!title && !icon && 'pt-6')}>
        {children}
      </CardContent>
    </Card>
  );
}
