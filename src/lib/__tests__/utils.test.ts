import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('base-class', 'additional-class');
    expect(result).toBe('base-class additional-class');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should filter out falsy values', () => {
    const result = cn('base', false && 'hidden', null, undefined, 'visible');
    expect(result).toBe('base visible');
  });

  it('should handle tailwind conflicts correctly', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle array of classes', () => {
    const classes = ['flex', 'items-center', 'justify-between'];
    const result = cn(...classes);
    expect(result).toBe('flex items-center justify-between');
  });
});

describe('Financial Calculations', () => {
  it('should calculate percentage correctly', () => {
    const calculatePercentage = (value: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((value / total) * 100 * 100) / 100;
    };

    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 1);
    expect(calculatePercentage(0, 100)).toBe(0);
    expect(calculatePercentage(100, 0)).toBe(0);
  });

  it('should format currency correctly', () => {
    const formatCurrency = (amount: number, currency = 'EUR'): string => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency,
      }).format(amount);
    };

    expect(formatCurrency(1234.56)).toContain('1.234,56');
    expect(formatCurrency(0)).toContain('0,00');
  });
});
