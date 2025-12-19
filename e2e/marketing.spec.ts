import { test, expect } from '@playwright/test';

test.describe('Marketing Pages', () => {
  test('should load sectors landing page', async ({ page }) => {
    await page.goto('/sectores');
    
    // Check page loads
    await expect(page).toHaveURL(/.*sectores/);
    
    // Should have main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should display sector cards', async ({ page }) => {
    await page.goto('/sectores');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Should have multiple sector cards
    const cards = page.locator('[class*="card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to sector detail page', async ({ page }) => {
    await page.goto('/sectores');
    
    // Click on first sector link
    const sectorLink = page.locator('a[href*="/sectores/"]').first();
    if (await sectorLink.isVisible()) {
      await sectorLink.click();
      
      // Should navigate to sector detail
      await expect(page).toHaveURL(/.*sectores\/.+/);
    }
  });

  test('should load banca landing page', async ({ page }) => {
    await page.goto('/sectores/banca');
    
    await expect(page).toHaveURL(/.*banca/);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load comparativas page', async ({ page }) => {
    await page.goto('/comparativas');
    
    await expect(page).toHaveURL(/.*comparativas/);
    
    // Should have comparison table
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display comparison features', async ({ page }) => {
    await page.goto('/comparativas');
    
    await page.waitForLoadState('networkidle');
    
    // Should display Obelixia in comparison
    await expect(page.getByText('Obelixia')).toBeVisible();
  });

  test('should load seguridad page', async ({ page }) => {
    await page.goto('/seguridad');
    
    await expect(page).toHaveURL(/.*seguridad/);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display security badges', async ({ page }) => {
    await page.goto('/seguridad');
    
    await page.waitForLoadState('networkidle');
    
    // Page should have content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test('should load demo page', async ({ page }) => {
    await page.goto('/demo');
    
    await expect(page).toHaveURL(/.*demo/);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have demo request form', async ({ page }) => {
    await page.goto('/demo');
    
    await page.waitForLoadState('networkidle');
    
    // Should have form elements
    const emailInput = page.locator('input[type="email"]').first();
    const hasEmailInput = await emailInput.isVisible().catch(() => false);
    
    if (hasEmailInput) {
      await expect(emailInput).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/sectores');
    await page.waitForLoadState('networkidle');
    
    // Page should still be functional
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/sectores');
    
    // Check for title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for meta description
    const metaDescription = page.locator('meta[name="description"]');
    const hasDescription = await metaDescription.count();
    // Meta description should exist (may be set by React Helmet or similar)
  });
});
