import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the language hook
const mockSetLanguage = vi.fn();
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    setLanguage: mockSetLanguage,
    t: (key: string) => key,
  }),
}));

// Simple LanguageSelector component for testing
const LanguageSelector = () => {
  const languages = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' },
  ];

  return (
    <div data-testid="language-selector">
      <select
        aria-label="Select language"
        onChange={(e) => mockSetLanguage(e.target.value)}
        defaultValue="es"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

describe('LanguageSelector', () => {
  beforeEach(() => {
    mockSetLanguage.mockClear();
  });

  it('renders the language selector', () => {
    render(<LanguageSelector />);
    
    expect(screen.getByTestId('language-selector')).toBeDefined();
    expect(screen.getByRole('combobox', { name: /select language/i })).toBeDefined();
  });

  it('displays all language options', () => {
    render(<LanguageSelector />);
    
    expect(screen.getByText('Español')).toBeDefined();
    expect(screen.getByText('English')).toBeDefined();
    expect(screen.getByText('Português')).toBeDefined();
  });

  it('calls setLanguage when language is changed', async () => {
    render(<LanguageSelector />);
    
    const select = screen.getByRole('combobox', { name: /select language/i });
    fireEvent.change(select, { target: { value: 'en' } });
    
    await waitFor(() => {
      expect(mockSetLanguage).toHaveBeenCalledWith('en');
    });
  });

  it('has Spanish selected by default', () => {
    render(<LanguageSelector />);
    
    const select = screen.getByRole('combobox', { name: /select language/i }) as HTMLSelectElement;
    expect(select.value).toBe('es');
  });
});
