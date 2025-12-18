import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCNAEPricing } from '../useCNAEPricing';

// Mock Supabase client
const mockInvoke = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useCNAEPricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useCNAEPricing());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.pricingResult).toBeNull();
    expect(result.current.bundleSuggestions).toBeNull();
  });

  it('provides all expected methods', () => {
    const { result } = renderHook(() => useCNAEPricing());
    
    expect(typeof result.current.calculatePricing).toBe('function');
    expect(typeof result.current.suggestBundles).toBe('function');
    expect(typeof result.current.fetchCNAEPricing).toBe('function');
    expect(typeof result.current.fetchBundles).toBe('function');
    expect(typeof result.current.fetchCompanyCnaes).toBe('function');
    expect(typeof result.current.addCompanyCnae).toBe('function');
    expect(typeof result.current.removeCompanyCnae).toBe('function');
    expect(typeof result.current.getComplexityTierColor).toBe('function');
    expect(typeof result.current.getTurnoverTierLabel).toBe('function');
  });

  describe('getComplexityTierColor', () => {
    it('returns correct colors for each tier', () => {
      const { result } = renderHook(() => useCNAEPricing());
      
      expect(result.current.getComplexityTierColor('basic')).toContain('green');
      expect(result.current.getComplexityTierColor('standard')).toContain('blue');
      expect(result.current.getComplexityTierColor('advanced')).toContain('purple');
      expect(result.current.getComplexityTierColor('enterprise')).toContain('orange');
      expect(result.current.getComplexityTierColor('unknown')).toContain('muted');
    });
  });

  describe('getTurnoverTierLabel', () => {
    it('returns correct labels for each tier', () => {
      const { result } = renderHook(() => useCNAEPricing());
      
      expect(result.current.getTurnoverTierLabel('micro')).toBe('< 500K€');
      expect(result.current.getTurnoverTierLabel('small')).toBe('500K€ - 1M€');
      expect(result.current.getTurnoverTierLabel('medium')).toBe('1M€ - 10M€');
      expect(result.current.getTurnoverTierLabel('large')).toBe('10M€ - 50M€');
      expect(result.current.getTurnoverTierLabel('enterprise')).toBe('> 50M€');
      expect(result.current.getTurnoverTierLabel('custom')).toBe('custom');
    });
  });

  describe('calculatePricing', () => {
    it('calls edge function with correct parameters', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          summary: { total_final_price: 1000 },
          details: [],
          available_bundles: [],
          recommendations: [],
        },
        error: null,
      });

      const { result } = renderHook(() => useCNAEPricing());
      
      await act(async () => {
        await result.current.calculatePricing(['6201', '6202'], 1000000, 'company-123');
      });

      expect(mockInvoke).toHaveBeenCalledWith('calculate-multi-cnae-pricing', {
        body: {
          cnae_codes: ['6201', '6202'],
          company_turnover: 1000000,
          company_id: 'company-123',
        },
      });
    });

    it('updates pricingResult on success', async () => {
      const mockPricingData = {
        summary: { total_final_price: 5000, total_savings: 500 },
        details: [{ cnae_code: '6201', final_price: 5000 }],
        available_bundles: [],
        recommendations: ['Consider bundle X'],
      };

      mockInvoke.mockResolvedValue({ data: mockPricingData, error: null });

      const { result } = renderHook(() => useCNAEPricing());
      
      await act(async () => {
        await result.current.calculatePricing(['6201']);
      });

      expect(result.current.pricingResult).toEqual(mockPricingData);
    });

    it('handles errors gracefully', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('API Error') });

      const { result } = renderHook(() => useCNAEPricing());
      
      let response: any;
      await act(async () => {
        response = await result.current.calculatePricing(['6201']);
      });

      expect(response).toBeNull();
    });
  });

  describe('suggestBundles', () => {
    it('calls edge function with correct parameters', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          current_cnaes: ['6201'],
          current_sectors: ['technology'],
          bundle_suggestions: [],
          complementary_cnaes: [],
          ai_recommendations: [],
        },
        error: null,
      });

      const { result } = renderHook(() => useCNAEPricing());
      
      await act(async () => {
        await result.current.suggestBundles(['6201'], 'technology', 500000);
      });

      expect(mockInvoke).toHaveBeenCalledWith('suggest-cnae-bundles', {
        body: {
          current_cnaes: ['6201'],
          company_sector: 'technology',
          company_turnover: 500000,
        },
      });
    });
  });

  describe('fetchCNAEPricing', () => {
    it('queries the cnae_pricing table', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useCNAEPricing());
      
      await act(async () => {
        await result.current.fetchCNAEPricing();
      });

      expect(mockFrom).toHaveBeenCalledWith('cnae_pricing');
    });
  });
});
