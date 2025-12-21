import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MarketingTabs } from '../MarketingTabs';
import { BrowserRouter } from 'react-router-dom';

// Mock child components
vi.mock('../ComparisonTable', () => ({
  ComparisonTable: () => <div data-testid="comparison-table">ComparisonTable</div>,
}));

vi.mock('../SecurityBadges', () => ({
  SecurityBadges: () => <div data-testid="security-badges">SecurityBadges</div>,
}));

vi.mock('../DemoRequestForm', () => ({
  DemoRequestForm: () => <div data-testid="demo-form">DemoRequestForm</div>,
}));

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('MarketingTabs', () => {
  it('should render all tab triggers', () => {
    renderWithRouter(<MarketingTabs />);
    
    expect(screen.getByText('Comparativas')).toBeInTheDocument();
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
    expect(screen.getByText('Demo')).toBeInTheDocument();
  });

  it('should render section title', () => {
    renderWithRouter(<MarketingTabs />);
    
    expect(screen.getByText('Por qué elegir Obelixia')).toBeInTheDocument();
  });

  it('should show comparison table by default', () => {
    renderWithRouter(<MarketingTabs />);
    
    expect(screen.getByTestId('comparison-table')).toBeInTheDocument();
  });

  it('should switch to security tab when clicked', () => {
    renderWithRouter(<MarketingTabs />);
    
    const securityTab = screen.getByText('Seguridad');
    fireEvent.click(securityTab);
    
    expect(screen.getByTestId('security-badges')).toBeInTheDocument();
  });

  it('should switch to demo tab when clicked', () => {
    renderWithRouter(<MarketingTabs />);
    
    const demoTab = screen.getByText('Demo');
    fireEvent.click(demoTab);
    
    expect(screen.getByTestId('demo-form')).toBeInTheDocument();
  });
});
