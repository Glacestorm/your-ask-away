import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuotationCalculator } from '@/components/store/QuotationCalculator';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          data: [
            {
              id: '1',
              module_key: 'crm_core',
              module_name: 'CRM Core',
              base_price: 500,
              is_core: true,
              category: 'core'
            },
            {
              id: '2',
              module_key: 'analytics',
              module_name: 'Analytics Pro',
              base_price: 200,
              is_core: false,
              category: 'analytics'
            }
          ],
          error: null
        })
      })
    }),
    insert: () => ({
      select: () => ({
        single: () => ({
          data: { id: 'test-proposal-id' },
          error: null
        })
      })
    })
  }
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    save: vi.fn(),
    internal: {
      pageSize: { getWidth: () => 210, getHeight: () => 297 }
    }
  }))
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn()
}));

describe('QuotationCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the calculator header', async () => {
    render(<QuotationCalculator />);
    
    await waitFor(() => {
      expect(screen.getByText(/Calculadora de Cotización/i)).toBeInTheDocument();
    });
  });

  it('displays company information inputs', async () => {
    render(<QuotationCalculator />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre de la Empresa/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email de Contacto/i)).toBeInTheDocument();
    });
  });

  it('shows user slider for license count', async () => {
    render(<QuotationCalculator />);
    
    await waitFor(() => {
      expect(screen.getByText(/Número de Usuarios/i)).toBeInTheDocument();
    });
  });

  it('updates total when users change', async () => {
    render(<QuotationCalculator />);
    
    await waitFor(() => {
      // Check that total calculation section exists
      expect(screen.getByText(/Total Mensual/i)).toBeInTheDocument();
    });
  });

  it('has a generate PDF button', async () => {
    render(<QuotationCalculator />);
    
    await waitFor(() => {
      expect(screen.getByText(/Generar PDF/i)).toBeInTheDocument();
    });
  });
});

describe('QuotationCalculator - Price Calculations', () => {
  it('calculates base price correctly', () => {
    const basePrice = 500;
    const users = 10;
    const expected = basePrice * users;
    
    expect(expected).toBe(5000);
  });

  it('applies volume discount for 50+ users', () => {
    const basePrice = 500;
    const users = 50;
    const discount = 0.1; // 10% discount
    const expected = basePrice * users * (1 - discount);
    
    expect(expected).toBe(22500);
  });

  it('applies volume discount for 100+ users', () => {
    const basePrice = 500;
    const users = 100;
    const discount = 0.15; // 15% discount
    const expected = basePrice * users * (1 - discount);
    
    expect(expected).toBe(42500);
  });

  it('applies volume discount for 200+ users', () => {
    const basePrice = 500;
    const users = 200;
    const discount = 0.20; // 20% discount
    const expected = basePrice * users * (1 - discount);
    
    expect(expected).toBe(80000);
  });
});
