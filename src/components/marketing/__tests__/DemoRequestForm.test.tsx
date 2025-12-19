import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DemoRequestForm } from '../DemoRequestForm';
import { BrowserRouter } from 'react-router-dom';

// Mock the toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('DemoRequestForm', () => {
  it('should render form fields', () => {
    renderWithRouter(<DemoRequestForm />);
    
    expect(screen.getByPlaceholderText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/empresa/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    renderWithRouter(<DemoRequestForm />);
    
    expect(screen.getByRole('button', { name: /solicitar demo/i })).toBeInTheDocument();
  });

  it('should render benefits list', () => {
    renderWithRouter(<DemoRequestForm />);
    
    expect(screen.getByText(/Demo personalizada/i)).toBeInTheDocument();
  });

  it('should update input values on change', () => {
    renderWithRouter(<DemoRequestForm />);
    
    const nameInput = screen.getByPlaceholderText(/nombre/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    expect(nameInput.value).toBe('John Doe');
  });

  it('should call onSuccess callback after submission', async () => {
    const onSuccess = vi.fn();
    renderWithRouter(<DemoRequestForm onSuccess={onSuccess} />);
    
    const nameInput = screen.getByPlaceholderText(/nombre/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const companyInput = screen.getByPlaceholderText(/empresa/i);
    
    fireEvent.change(nameInput, { target: { value: 'John' } });
    fireEvent.change(emailInput, { target: { value: 'john@test.com' } });
    fireEvent.change(companyInput, { target: { value: 'Test Corp' } });
  });
});
