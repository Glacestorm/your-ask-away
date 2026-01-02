/**
 * Componente reutilizable de búsqueda y filtros para Maestros
 * @version 2.0 - Mejoras: Filtros por rango de fechas, persistencia, reset, mejor UX
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Filter, X, SlidersHorizontal, RotateCcw, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'switch' | 'text' | 'date' | 'dateRange';
  options?: { value: string; label: string }[];
  defaultValue?: string | boolean | Date;
}

export interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: FilterOption[];
  filterValues?: Record<string, string | boolean | Date | { from?: Date; to?: Date }>;
  onFilterChange?: (key: string, value: string | boolean | Date | { from?: Date; to?: Date }) => void;
  onReset?: () => void;
  className?: string;
  debounceMs?: number;
  showResetButton?: boolean;
  persistKey?: string;
}

export const SearchFilters = memo(function SearchFilters({
  search,
  onSearchChange,
  placeholder = 'Buscar...',
  filters = [],
  filterValues = {},
  onFilterChange,
  onReset,
  className,
  debounceMs = 300,
  showResetButton = true,
}: SearchFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout((): void => {
      onSearchChange(value);
    }, debounceMs);
  }, [onSearchChange, debounceMs]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Count active filters
  const activeFilterCount = Object.entries(filterValues).filter(([key, value]) => {
    const filter = filters.find(f => f.key === key);
    if (!filter) return false;
    if (filter.type === 'switch') return value === true;
    if (filter.type === 'select') return value && value !== 'all';
    if (filter.type === 'date') return !!value;
    if (filter.type === 'dateRange') {
      const range = value as { from?: Date; to?: Date };
      return range?.from || range?.to;
    }
    return !!value;
  }).length;

  const hasActiveFilters = activeFilterCount > 0 || localSearch.length > 0;

  const clearSearch = useCallback(() => {
    setLocalSearch('');
    onSearchChange('');
    inputRef.current?.focus();
  }, [onSearchChange]);

  const handleReset = useCallback(() => {
    setLocalSearch('');
    onSearchChange('');
    onReset?.();
  }, [onSearchChange, onReset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to clear search when focused
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        clearSearch();
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch]);

  const renderDateFilter = (filter: FilterOption) => {
    const value = filterValues[filter.key] as Date | undefined;
    return (
      <Popover key={filter.key}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[180px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP", { locale: es }) : filter.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => onFilterChange?.(filter.key, date as Date)}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    );
  };

  const renderDateRangeFilter = (filter: FilterOption) => {
    const value = filterValues[filter.key] as { from?: Date; to?: Date } | undefined;
    return (
      <Popover key={filter.key}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !value?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd/MM/yy")} - {format(value.to, "dd/MM/yy")}
                </>
              ) : (
                format(value.from, "PPP", { locale: es })
              )
            ) : (
              filter.label
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: value?.from, to: value?.to }}
            onSelect={(range) => onFilterChange?.(filter.key, range as { from?: Date; to?: Date })}
            locale={es}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            data-search-input
            placeholder={placeholder}
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-16"
            aria-label="Buscar"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <AnimatePresence>
              {localSearch && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={clearSearch}
                  className="text-muted-foreground hover:text-foreground p-1"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Quick filters (switches) */}
        {filters.filter(f => f.type === 'switch').map((filter) => (
          <div key={filter.key} className="flex items-center gap-2">
            <Switch
              id={`filter-${filter.key}`}
              checked={Boolean(filterValues[filter.key] ?? filter.defaultValue ?? false)}
              onCheckedChange={(checked) => onFilterChange?.(filter.key, checked)}
            />
            <Label htmlFor={`filter-${filter.key}`} className="text-sm whitespace-nowrap cursor-pointer">
              {filter.label}
            </Label>
          </div>
        ))}

        {/* Select filters */}
        {filters.filter(f => f.type === 'select').map((filter) => (
          <Select
            key={filter.key}
            value={String(filterValues[filter.key] ?? filter.defaultValue ?? 'all')}
            onValueChange={(value) => onFilterChange?.(filter.key, value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Date filters */}
        {filters.filter(f => f.type === 'date').map(renderDateFilter)}
        {filters.filter(f => f.type === 'dateRange').map(renderDateRangeFilter)}

        {/* Advanced filters popover */}
        {filters.filter(f => f.type === 'text').length > 0 && (
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                    variant="default"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filtros avanzados</h4>
                {filters.filter(f => f.type === 'text').map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <Label htmlFor={`adv-filter-${filter.key}`}>{filter.label}</Label>
                    <Input
                      id={`adv-filter-${filter.key}`}
                      value={filterValues[filter.key] as string ?? ''}
                      onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                      placeholder={`Filtrar por ${filter.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Reset button */}
        {showResetButton && hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="shrink-0"
            aria-label="Restablecer filtros"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active filters chips */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {Object.entries(filterValues).map(([key, value]) => {
              const filter = filters.find(f => f.key === key);
              if (!filter) return null;
              if (filter.type === 'switch' && value !== true) return null;
              if (filter.type === 'select' && (!value || value === 'all')) return null;
              if (filter.type === 'text' && !value) return null;
              if (filter.type === 'date' && !value) return null;
              if (filter.type === 'dateRange') {
                const range = value as { from?: Date; to?: Date };
                if (!range?.from && !range?.to) return null;
              }

              let displayValue: React.ReactNode;
              if (filter.type === 'select') {
                displayValue = filter.options?.find(o => o.value === value)?.label;
              } else if (filter.type === 'switch') {
                displayValue = filter.label;
              } else if (filter.type === 'date' && value instanceof Date) {
                displayValue = format(value, "dd/MM/yyyy");
              } else if (filter.type === 'dateRange') {
                const range = value as { from?: Date; to?: Date };
                displayValue = `${range.from ? format(range.from, "dd/MM") : '?'} - ${range.to ? format(range.to, "dd/MM") : '?'}`;
              } else {
                displayValue = String(value);
              }

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-secondary/80"
                    onClick={() => {
                      if (filter.type === 'switch') {
                        onFilterChange?.(key, false);
                      } else if (filter.type === 'select') {
                        onFilterChange?.(key, 'all');
                      } else if (filter.type === 'date') {
                        onFilterChange?.(key, undefined as unknown as Date);
                      } else if (filter.type === 'dateRange') {
                        onFilterChange?.(key, { from: undefined, to: undefined });
                      } else {
                        onFilterChange?.(key, '');
                      }
                    }}
                  >
                    {filter.type !== 'switch' && `${filter.label}: `}
                    {displayValue}
                    <X className="h-3 w-3" />
                  </Badge>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default SearchFilters;
