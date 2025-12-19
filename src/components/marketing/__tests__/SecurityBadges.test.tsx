import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SecurityBadges } from '../SecurityBadges';

describe('SecurityBadges', () => {
  it('should render default certifications', () => {
    render(<SecurityBadges />);
    
    expect(screen.getByText('DORA')).toBeInTheDocument();
    expect(screen.getByText('NIS2')).toBeInTheDocument();
    expect(screen.getByText('GDPR')).toBeInTheDocument();
    expect(screen.getByText('ENS')).toBeInTheDocument();
  });

  it('should render enterprise security banner', () => {
    render(<SecurityBadges />);
    
    expect(screen.getByText('Seguridad de Nivel Empresarial')).toBeInTheDocument();
  });

  it('should render with custom certifications', () => {
    const customCerts = [
      {
        title: 'ISO 27001',
        subtitle: 'Security',
        description: 'Information security',
        items: ['Control 1', 'Control 2'],
      },
    ];
    
    render(<SecurityBadges certifications={customCerts} />);
    
    expect(screen.getByText('ISO 27001')).toBeInTheDocument();
    expect(screen.getByText('Control 1')).toBeInTheDocument();
  });

  it('should render certification items', () => {
    render(<SecurityBadges />);
    
    // Check for some default items
    expect(screen.getByText(/Resiliencia operativa/i)).toBeInTheDocument();
  });
});
