/**
 * Skeletons de carga reutilizables
 * @version 1.0 - Variantes para tablas, cards, formularios y listas
 */

import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export const TableSkeleton = memo(function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton 
              key={`header-${i}`} 
              className={cn(
                'h-4',
                i === 0 ? 'w-8' : 'flex-1'
              )} 
            />
          ))}
        </div>
      )}
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="flex items-center gap-4 p-4 border-b last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className={cn(
                'h-4',
                colIndex === 0 ? 'w-8' : 'flex-1',
                colIndex === columns - 1 && 'w-20'
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
});

export interface CardSkeletonProps {
  showImage?: boolean;
  showBadge?: boolean;
  lines?: number;
  className?: string;
}

export const CardSkeleton = memo(function CardSkeleton({
  showImage = false,
  showBadge = false,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {showImage && (
        <Skeleton className="w-full h-48 rounded-none" />
      )}
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-3/4" />
          {showBadge && <Skeleton className="h-5 w-16 rounded-full" />}
        </div>
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'h-4',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )} 
          />
        ))}
      </CardContent>
    </Card>
  );
});

export interface FormSkeletonProps {
  fields?: number;
  columns?: 1 | 2;
  showButtons?: boolean;
  className?: string;
}

export const FormSkeleton = memo(function FormSkeleton({
  fields = 4,
  columns = 1,
  showButtons = true,
  className,
}: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className={cn(
        'grid gap-4',
        columns === 2 && 'md:grid-cols-2'
      )}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      {showButtons && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </div>
  );
});

export interface StatsSkeletonProps {
  count?: number;
  className?: string;
}

export const StatsSkeleton = memo(function StatsSkeleton({
  count = 4,
  className,
}: StatsSkeletonProps) {
  return (
    <div className={cn(
      'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}

export const ListSkeleton = memo(function ListSkeleton({
  items = 5,
  showAvatar = false,
  showActions = false,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-3 rounded-lg border"
        >
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          {showActions && (
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

export interface PageSkeletonProps {
  showStats?: boolean;
  showFilters?: boolean;
  tableRows?: number;
  className?: string;
}

export const PageSkeleton = memo(function PageSkeleton({
  showStats = true,
  showFilters = true,
  tableRows = 5,
  className,
}: PageSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats */}
      {showStats && <StatsSkeleton />}

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      {/* Table */}
      <Card>
        <TableSkeleton rows={tableRows} columns={5} />
      </Card>
    </div>
  );
});

export default {
  Table: TableSkeleton,
  Card: CardSkeleton,
  Form: FormSkeleton,
  Stats: StatsSkeleton,
  List: ListSkeleton,
  Page: PageSkeleton,
};