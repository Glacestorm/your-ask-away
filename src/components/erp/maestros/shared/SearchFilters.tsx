/**
 * Componente reutilizable de búsqueda y filtros para Maestros
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'switch' | 'text';
  options?: { value: string; label: string }[];
  defaultValue?: string | boolean;
}

export interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: FilterOption[];
  filterValues?: Record<string, string | boolean>;
  onFilterChange?: (key: string, value: string | boolean) => void;
  className?: string;
  debounceMs?: number;
}

export const SearchFilters = memo(function SearchFilters({
  search,
  onSearchChange,
  placeholder = 'Buscar...',
  filters = [],
  filterValues = {},
  onFilterChange,
  className,
  debounceMs = 300
}: SearchFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    return !!value;
  }).length;

  const clearSearch = useCallback(() => {
    setLocalSearch('');
    onSearchChange('');
  }, [onSearchChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Escape to clear search when focused
      if (e.key === 'Escape' && document.activeElement?.hasAttribute('data-search-input')) {
        clearSearch();
        (document.activeElement as HTMLElement)?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-search-input
            placeholder={placeholder}
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-8"
          />
          <AnimatePresence>
            {localSearch && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hidden sm:block">
            ⌘K
          </span>
        </div>

        {/* Quick filters (switches) */}
        {filters.filter(f => f.type === 'switch').map((filter) => (
          <div key={filter.key} className="flex items-center gap-2">
            <Switch
              id={`filter-${filter.key}`}
              checked={Boolean(filterValues[filter.key] ?? filter.defaultValue ?? false)}
              onCheckedChange={(checked) => onFilterChange?.(filter.key, checked)}
            />
            <Label htmlFor={`filter-${filter.key}`} className="text-sm whitespace-nowrap">
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

        {/* Advanced filters popover */}
        {filters.filter(f => f.type === 'text').length > 0 && (
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
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

              const displayValue = filter.type === 'select'
                ? filter.options?.find(o => o.value === value)?.label
                : filter.type === 'switch'
                  ? filter.label
                  : value;

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
