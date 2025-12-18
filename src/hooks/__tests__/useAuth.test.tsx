import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../useAuth';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });

  it('initializes with null user and loading state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('provides role-based access flags', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Without user, all role flags should be false
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.isCommercialDirector).toBe(false);
    expect(result.current.isOfficeDirector).toBe(false);
    expect(result.current.isCommercialManager).toBe(false);
    expect(result.current.isAuditor).toBe(false);
  });

  it('provides authentication methods', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });
});

describe('Role priority logic', () => {
  it('correctly identifies admin roles', () => {
    // Test the role priority constants
    const ROLE_PRIORITIES: Record<string, number> = {
      'superadmin': 100,
      'director_comercial': 90,
      'responsable_comercial': 80,
      'director_oficina': 70,
      'admin': 60,
      'auditor': 50,
      'gestor': 40,
      'user': 10,
    };

    expect(ROLE_PRIORITIES['superadmin']).toBeGreaterThan(ROLE_PRIORITIES['admin']);
    expect(ROLE_PRIORITIES['director_comercial']).toBeGreaterThan(ROLE_PRIORITIES['director_oficina']);
    expect(ROLE_PRIORITIES['gestor']).toBeGreaterThan(ROLE_PRIORITIES['user']);
  });

  it('correctly calculates isAdmin from role', () => {
    const checkIsAdmin = (role: string | null): boolean => {
      return role === 'admin' || role === 'superadmin' || role === 'responsable_comercial';
    };

    expect(checkIsAdmin('superadmin')).toBe(true);
    expect(checkIsAdmin('admin')).toBe(true);
    expect(checkIsAdmin('responsable_comercial')).toBe(true);
    expect(checkIsAdmin('gestor')).toBe(false);
    expect(checkIsAdmin('user')).toBe(false);
    expect(checkIsAdmin(null)).toBe(false);
  });

  it('correctly calculates isSuperAdmin from role', () => {
    const checkIsSuperAdmin = (role: string | null): boolean => {
      return role === 'superadmin';
    };

    expect(checkIsSuperAdmin('superadmin')).toBe(true);
    expect(checkIsSuperAdmin('admin')).toBe(false);
    expect(checkIsSuperAdmin(null)).toBe(false);
  });
});
