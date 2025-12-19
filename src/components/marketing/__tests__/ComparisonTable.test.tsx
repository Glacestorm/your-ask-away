import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComparisonTable } from '../ComparisonTable';

describe('ComparisonTable', () => {
  it('should render the comparison table', () => {
    render(<ComparisonTable />);
    
    expect(screen.getByText('Obelixia')).toBeInTheDocument();
    expect(screen.getByText('CRM Tradicional')).toBeInTheDocument();
    expect(screen.getByText('ERP Legacy')).toBeInTheDocument();
  });

  it('should render default comparison rows', () => {
    render(<ComparisonTable />);
    
    expect(screen.getByText('IA Integrada')).toBeInTheDocument();
    expect(screen.getByText('Cumplimiento Normativo')).toBeInTheDocument();
  });

  it('should render with custom data', () => {
    const customData = [
      { feature: 'Custom Feature', obelixia: 'Yes', crm: 'No', erp: 'No' },
    ];
    
    render(<ComparisonTable data={customData} />);
    
    expect(screen.getByText('Custom Feature')).toBeInTheDocument();
  });

  it('should display the summary section', () => {
    render(<ComparisonTable />);
    
    expect(screen.getByText(/Obelixia combina lo mejor/i)).toBeInTheDocument();
  });
});
