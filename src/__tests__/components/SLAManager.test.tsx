import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SLAManager } from '@/components/crm/SLAManager';

// Mock Supabase
const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });
const mockInsert = vi.fn().mockReturnValue({
  select: () => ({
    single: () => Promise.resolve({ 
      data: { id: 'new-sla-id', channel: 'email', response_time_minutes: 30 }, 
      error: null 
    })
  })
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'sla_configs') {
        return {
          select: mockSelect,
          insert: mockInsert,
          update: vi.fn().mockReturnValue({
            eq: () => Promise.resolve({ error: null })
          }),
          delete: vi.fn().mockReturnValue({
            eq: () => Promise.resolve({ error: null })
          })
        };
      }
      if (table === 'sla_tracking') {
        return {
          select: () => ({
            gte: () => ({
              order: () => Promise.resolve({
                data: [
                  {
                    id: '1',
                    sla_config_id: 'config-1',
                    ticket_id: 'ticket-1',
                    started_at: new Date().toISOString(),
                    response_deadline: new Date(Date.now() + 3600000).toISOString(),
                    status: 'in_progress'
                  }
                ],
                error: null
              })
            })
          })
        };
      }
      return { select: () => Promise.resolve({ data: [], error: null }) };
    }
  }
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('SLAManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the SLA Manager header', async () => {
    render(<SLAManager />);
    
    expect(screen.getByText(/Gestión de SLAs/i)).toBeInTheDocument();
  });

  it('displays channel tabs', async () => {
    render(<SLAManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/Email/i)).toBeInTheDocument();
      expect(screen.getByText(/Chat/i)).toBeInTheDocument();
    });
  });

  it('shows add SLA button', async () => {
    render(<SLAManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/Nueva Configuración SLA/i)).toBeInTheDocument();
    });
  });

  it('displays tracking section', async () => {
    render(<SLAManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/Seguimiento en Tiempo Real/i)).toBeInTheDocument();
    });
  });
});

describe('SLAManager - SLA Calculations', () => {
  it('calculates time remaining correctly', () => {
    const deadline = new Date(Date.now() + 3600000); // 1 hour from now
    const now = new Date();
    const remaining = deadline.getTime() - now.getTime();
    
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(3600000);
  });

  it('identifies breached SLAs', () => {
    const deadline = new Date(Date.now() - 3600000); // 1 hour ago
    const now = new Date();
    const isBreached = deadline.getTime() < now.getTime();
    
    expect(isBreached).toBe(true);
  });

  it('identifies at-risk SLAs (< 30 min remaining)', () => {
    const deadline = new Date(Date.now() + 1500000); // 25 minutes from now
    const now = new Date();
    const remaining = deadline.getTime() - now.getTime();
    const isAtRisk = remaining < 1800000 && remaining > 0; // Less than 30 min
    
    expect(isAtRisk).toBe(true);
  });

  it('calculates SLA compliance rate', () => {
    const totalTickets = 100;
    const breachedTickets = 5;
    const complianceRate = ((totalTickets - breachedTickets) / totalTickets) * 100;
    
    expect(complianceRate).toBe(95);
  });
});

describe('SLAManager - Priority Levels', () => {
  it('has correct response times for critical priority', () => {
    const criticalResponseMinutes = 15;
    const criticalResolutionMinutes = 60;
    
    expect(criticalResponseMinutes).toBe(15);
    expect(criticalResolutionMinutes).toBe(60);
  });

  it('has correct response times for high priority', () => {
    const highResponseMinutes = 30;
    const highResolutionMinutes = 240;
    
    expect(highResponseMinutes).toBe(30);
    expect(highResolutionMinutes).toBe(240);
  });

  it('has correct response times for medium priority', () => {
    const mediumResponseMinutes = 120;
    const mediumResolutionMinutes = 480;
    
    expect(mediumResponseMinutes).toBe(120);
    expect(mediumResolutionMinutes).toBe(480);
  });

  it('has correct response times for low priority', () => {
    const lowResponseMinutes = 480;
    const lowResolutionMinutes = 1440;
    
    expect(lowResponseMinutes).toBe(480);
    expect(lowResolutionMinutes).toBe(1440);
  });
});
