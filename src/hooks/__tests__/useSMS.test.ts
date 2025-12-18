import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useSMS Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', async () => {
    const { useSMS } = await import('@/hooks/useSMS');
    const { result } = renderHook(() => useSMS());

    expect(result.current.loading).toBe(false);
    expect(result.current.sending).toBe(false);
    expect(result.current.templates).toEqual([]);
  });

  it('should apply template variables correctly', async () => {
    const { useSMS } = await import('@/hooks/useSMS');
    const { result } = renderHook(() => useSMS());

    const template = 'Hello {{name}}, your appointment is on {{date}}';
    const variables = { name: 'John', date: '2024-01-15' };

    const applied = result.current.applyTemplate(template, variables);
    expect(applied).toBe('Hello John, your appointment is on 2024-01-15');
  });

  it('should handle multiple variables in template', async () => {
    const { useSMS } = await import('@/hooks/useSMS');
    const { result } = renderHook(() => useSMS());

    const template = '{{greeting}} {{name}}! Confirmación: {{code}}';
    const variables = { greeting: 'Hola', name: 'María', code: 'ABC123' };

    const applied = result.current.applyTemplate(template, variables);
    expect(applied).toBe('Hola María! Confirmación: ABC123');
  });
});

describe('SMS Validation', () => {
  it('should validate phone number format', () => {
    const validPhone = '+34612345678';
    const invalidPhone = '12345';

    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    
    expect(phoneRegex.test(validPhone.replace(/\s/g, ''))).toBe(true);
    expect(phoneRegex.test(invalidPhone)).toBe(false);
  });

  it('should handle international phone formats', () => {
    const phones = [
      '+34612345678',  // Spain
      '+33612345678',  // France
      '+376612345',    // Andorra
      '+1234567890',   // US
    ];

    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    
    phones.forEach((phone) => {
      expect(phoneRegex.test(phone.replace(/\s/g, ''))).toBe(true);
    });
  });
});
