import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect root to store', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/store/);
  });

  test('should load store landing page', async ({ page }) => {
    await page.goto('/store');
    await expect(page).toHaveTitle(/ObelixIA/);
  });

  test('should navigate to modules page', async ({ page }) => {
    await page.goto('/store');
    
    // Look for modules link/button
    const modulesLink = page.getByRole('link', { name: /módulos|modules/i });
    if (await modulesLink.isVisible()) {
      await modulesLink.click();
      await expect(page).toHaveURL(/.*\/store\/modules/);
    }
  });

  test('should show 404 for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page-xyz');
    await expect(page.locator('body')).toContainText(/404|not found|no encontrada/i);
  });

  test('should have responsive navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/store');
    
    // Check for mobile menu button or hamburger
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      // Verify navigation menu opens
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    }
  });
});

test.describe('Store Pages', () => {
  test('should display featured modules', async ({ page }) => {
    await page.goto('/store');
    
    // Check for module cards or featured section
    const moduleSection = page.locator('[data-testid="featured-modules"], .featured-modules, section');
    await expect(moduleSection.first()).toBeVisible();
  });

  test('should have working language selector', async ({ page }) => {
    await page.goto('/store');
    
    // Look for language selector
    const languageSelector = page.locator('[data-testid="language-selector"], button[aria-label*="language"], .language-selector');
    if (await languageSelector.isVisible()) {
      await languageSelector.click();
      // Verify language options appear
      await expect(page.getByText(/english|español|català|français/i).first()).toBeVisible();
    }
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/store');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/store');
    await page.waitForLoadState('networkidle');

    // Filter out expected/known errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
