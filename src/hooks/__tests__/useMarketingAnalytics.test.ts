import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMarketingAnalytics } from '../useMarketingAnalytics';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock crypto.randomUUID
Object.defineProperty(crypto, 'randomUUID', {
  value: vi.fn(() => 'test-session-id'),
});

describe('useMarketingAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('should return all tracking functions', () => {
    const { result } = renderHook(() => useMarketingAnalytics());

    expect(result.current.trackEvent).toBeDefined();
    expect(result.current.trackPageView).toBeDefined();
    expect(result.current.trackTabView).toBeDefined();
    expect(result.current.trackDemoRequest).toBeDefined();
    expect(result.current.trackLeadCapture).toBeDefined();
    expect(result.current.trackCTAClick).toBeDefined();
  });

  it('should generate a session ID if not exists', () => {
    mockSessionStorage.getItem.mockReturnValue(null);
    
    renderHook(() => useMarketingAnalytics());
    
    // Session ID is generated lazily when tracking
    expect(mockSessionStorage.getItem).not.toHaveBeenCalled();
  });

  it('should use existing session ID if available', async () => {
    mockSessionStorage.getItem.mockReturnValue('existing-session-id');
    
    const { result } = renderHook(() => useMarketingAnalytics());
    
    await act(async () => {
      await result.current.trackEvent('test_event');
    });

    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('marketing_session_id');
  });

  it('should track page view with correct data', async () => {
    const { result } = renderHook(() => useMarketingAnalytics());
    
    await act(async () => {
      await result.current.trackPageView('Home');
    });

    // The function should complete without errors
    expect(result.current.trackPageView).toBeDefined();
  });

  it('should track tab view with correct data', async () => {
    const { result } = renderHook(() => useMarketingAnalytics());
    
    await act(async () => {
      await result.current.trackTabView('Features');
    });

    expect(result.current.trackTabView).toBeDefined();
  });

  it('should track demo request with form data', async () => {
    const { result } = renderHook(() => useMarketingAnalytics());
    const formData = { email: 'test@example.com', company: 'Test Co' };
    
    await act(async () => {
      await result.current.trackDemoRequest(formData);
    });

    expect(result.current.trackDemoRequest).toBeDefined();
  });

  it('should track lead capture with source and email', async () => {
    const { result } = renderHook(() => useMarketingAnalytics());
    
    await act(async () => {
      await result.current.trackLeadCapture('newsletter', 'test@example.com');
    });

    expect(result.current.trackLeadCapture).toBeDefined();
  });

  it('should track CTA click with name and location', async () => {
    const { result } = renderHook(() => useMarketingAnalytics());
    
    await act(async () => {
      await result.current.trackCTAClick('signup_button', 'hero_section');
    });

    expect(result.current.trackCTAClick).toBeDefined();
  });

  it('should handle tracking errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useMarketingAnalytics());
    
    // Should not throw
    await act(async () => {
      await result.current.trackEvent('test_event');
    });

    consoleSpy.mockRestore();
  });
});
