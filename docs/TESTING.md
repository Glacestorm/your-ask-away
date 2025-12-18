# Testing Guide

This document describes the testing strategy and tools used in this project.

## Overview

The project uses a comprehensive testing approach with:
- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Static Analysis**: ESLint + TypeScript
- **Security Scanning**: Semgrep + Gitleaks

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npx vitest run

# Run tests in watch mode
npx vitest

# Run tests with coverage
npx vitest run --coverage

# Run specific test file
npx vitest run src/components/__tests__/Button.test.tsx
```

### E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Run with UI mode (interactive)
npx playwright test --ui

# Generate test report
npx playwright show-report
```

## Test Structure

```
├── src/
│   ├── test/
│   │   ├── setup.ts          # Vitest global setup & mocks
│   │   └── utils.tsx         # Custom render with providers
│   ├── components/
│   │   └── __tests__/        # Component unit tests
│   ├── hooks/
│   │   └── __tests__/        # Hook unit tests
│   └── utils/
│       └── __tests__/        # Utility function tests
├── e2e/
│   ├── navigation.spec.ts    # Navigation E2E tests
│   └── *.spec.ts             # Other E2E test files
├── vitest.config.ts          # Vitest configuration
└── playwright.config.ts      # Playwright configuration
```

## Writing Tests

### Unit Test Example

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading')).toBeVisible();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## Test Configuration

### Vitest Config (`vitest.config.ts`)

Key settings:
- Environment: `jsdom` for DOM testing
- Globals: `true` for global test functions
- Coverage: V8 provider with thresholds

### Playwright Config (`playwright.config.ts`)

Key settings:
- Browsers: Chromium, Firefox, WebKit, Mobile
- Base URL: `http://localhost:8080`
- Screenshots on failure
- Trace on first retry

## Mocking

### Supabase Client

The Supabase client is automatically mocked in `src/test/setup.ts`. Override specific methods in individual tests:

```tsx
import { supabase } from '@/integrations/supabase/client';
import { vi } from 'vitest';

vi.mocked(supabase.from).mockReturnValue({
  select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
  // ... other methods
});
```

### Browser APIs

Common browser APIs are mocked in setup:
- `localStorage` / `sessionStorage`
- `fetch`
- `matchMedia`
- `ResizeObserver`
- `IntersectionObserver`

## CI/CD Integration

Tests run automatically on:
- Push to `main` branch
- Pull requests to `main` branch

### CI Workflows

1. **ci.yml**: Lint, Type Check, Unit Tests, Build
2. **e2e.yml**: Playwright E2E tests
3. **semgrep.yml**: Security static analysis

## Coverage Requirements

Minimum coverage thresholds:
- Statements: 60%
- Branches: 60%
- Functions: 60%
- Lines: 60%

## Best Practices

1. **Test behavior, not implementation**
2. **Use meaningful test descriptions**
3. **Keep tests isolated and independent**
4. **Mock external dependencies**
5. **Use custom render from `@/test/utils`**
6. **Follow AAA pattern: Arrange, Act, Assert**

## Troubleshooting

### Tests failing with import errors

Ensure path aliases are configured in `vitest.config.ts`:

```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### Supabase mock not working

Import the mocked client after the mock is set up:

```tsx
// In test file
vi.mock('@/integrations/supabase/client');
import { supabase } from '@/integrations/supabase/client';
```

### E2E tests timing out

- Increase timeout in test or config
- Check if dev server is running on correct port
- Verify network requests are completing
