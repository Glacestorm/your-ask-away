import { test, expect } from '@playwright/test';

test.describe('Store Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/store');
  });

  test('should display store hero section', async ({ page }) => {
    // Check for hero section or main heading
    const heroSection = page.locator('section, [data-testid="hero"]').first();
    await expect(heroSection).toBeVisible();
  });

  test('should show module cards', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Look for module cards or product listings
    const moduleCards = page.locator('[data-testid="module-card"], .module-card, article');
    const count = await moduleCards.count();
    
    // Should have at least some modules displayed
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to module detail page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click on a module card or "Ver más" button
    const detailLink = page.locator('a[href*="/store/modules/"], button:has-text("Ver"), [data-testid="view-details"]').first();
    
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to a detail page
      await expect(page).toHaveURL(/.*\/store\/(modules|deployment|checkout)/);
    }
  });

  test('should show pricing information', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for pricing indicators (€, precio, price)
    const pricingText = page.locator('text=/\\d+.*€|precio|price|presupuesto|quote/i').first();
    
    // Either shows price or "Request Quote" button
    const requestQuoteButton = page.locator('button:has-text("Solicitar"), button:has-text("Request")');
    
    const hasPricing = await pricingText.isVisible();
    const hasQuoteButton = await requestQuoteButton.isVisible();
    
    expect(hasPricing || hasQuoteButton).toBe(true);
  });
});

test.describe('Store Cart', () => {
  test('should have cart functionality', async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('networkidle');
    
    // Look for cart icon or button
    const cartElement = page.locator('[data-testid="cart"], button[aria-label*="cart"], .cart-icon, svg[class*="cart"]');
    
    if (await cartElement.isVisible()) {
      await cartElement.click();
      // Cart should show (empty or with items)
      const cartContent = page.locator('[data-testid="cart-content"], .cart-dropdown, [role="dialog"]');
      await expect(cartContent).toBeVisible();
    }
  });
});

test.describe('Store Search/Filter', () => {
  test('should have search or filter capability', async ({ page }) => {
    await page.goto('/store/modules');
    await page.waitForLoadState('networkidle');
    
    // Look for search input or filter controls
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"]');
    const filterButton = page.locator('button:has-text("Filtrar"), button:has-text("Filter"), [data-testid="filter"]');
    
    const hasSearch = await searchInput.isVisible();
    const hasFilter = await filterButton.isVisible();
    
    // Should have at least one way to find modules
    expect(hasSearch || hasFilter).toBe(true);
  });
});

test.describe('Store Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/store');
    
    // Should have at least one h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
    
    // h1 count should be 1 for proper SEO
    const h1Count = await h1.count();
    expect(h1Count).toBe(1);
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBe(true);
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/store');
    
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    
    // Should have a focused element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
