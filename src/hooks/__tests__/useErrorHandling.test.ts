import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandling } from '../useErrorHandling';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('useErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with no error', () => {
    const { result } = renderHook(() => useErrorHandling());
    
    expect(result.current.hasError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isRecoverable).toBe(true);
  });

  it('handles an error and updates state', () => {
    const { result } = renderHook(() => useErrorHandling({ showToasts: false }));
    
    act(() => {
      result.current.handleError(new Error('Test error'));
    });
    
    expect(result.current.hasError).toBe(true);
    expect(result.current.error?.message).toBe('Test error');
  });

  it('clears error state', () => {
    const { result } = renderHook(() => useErrorHandling({ showToasts: false }));
    
    act(() => {
      result.current.handleError(new Error('Test error'));
    });
    
    expect(result.current.hasError).toBe(true);
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.hasError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles non-Error objects', () => {
    const { result } = renderHook(() => useErrorHandling({ showToasts: false }));
    
    act(() => {
      result.current.handleError('String error');
    });
    
    expect(result.current.hasError).toBe(true);
    expect(result.current.error?.code).toBe('UNKNOWN_ERROR');
  });

  it('executes async operation successfully', async () => {
    const { result } = renderHook(() => useErrorHandling({ showToasts: false }));
    
    let response: string | null = null;
    await act(async () => {
      response = await result.current.executeAsync(Promise.resolve('success'));
    });
    
    expect(response).toBe('success');
    expect(result.current.hasError).toBe(false);
  });

  it('handles async operation failure', async () => {
    const { result } = renderHook(() => useErrorHandling({ showToasts: false }));
    
    let response: string | null = null;
    await act(async () => {
      response = await result.current.executeAsync(Promise.reject(new Error('async error')));
    });
    
    expect(response).toBeNull();
    expect(result.current.hasError).toBe(true);
  });

  it('tracks error count', () => {
    const { result } = renderHook(() => useErrorHandling({ showToasts: false }));
    
    act(() => {
      result.current.handleError(new Error('Error 1'));
      result.current.handleError(new Error('Error 2'));
      result.current.handleError(new Error('Error 3'));
    });
    
    expect(result.current.errorCount).toBe(3);
  });

  it('handles network errors with classification', () => {
    const { result } = renderHook(() => useErrorHandling({ showToasts: false }));
    
    let networkResult: { type: string; retryable: boolean } | undefined;
    act(() => {
      networkResult = result.current.handleNetworkError(new Error('fetch failed'));
    });
    
    expect(result.current.hasError).toBe(true);
    expect(networkResult?.type).toBe('server');
    expect(networkResult?.retryable).toBe(true);
  });

  it('uses component name in error logging', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => 
      useErrorHandling({ component: 'TestComponent', showToasts: false })
    );
    
    act(() => {
      result.current.handleError(new Error('Logged error'));
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestComponent]'),
      expect.any(Object)
    );
    
    consoleSpy.mockRestore();
  });

  it('disables logging when logErrors is false', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => 
      useErrorHandling({ showToasts: false, logErrors: false })
    );
    
    act(() => {
      result.current.handleError(new Error('Not logged'));
    });
    
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
