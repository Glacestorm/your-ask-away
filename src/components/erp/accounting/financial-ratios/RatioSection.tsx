/**
 * RatioSection - Componente para sección de ratios agrupados
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface RatioSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

export function RatioSection({
  title,
  icon: Icon,
  children,
  className
}: RatioSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
}

export default RatioSection;
