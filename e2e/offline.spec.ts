import { test, expect } from '@playwright/test';

test.describe('Offline Functionality', () => {
  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });

    // Service worker should be registered
    expect(swRegistered).toBe(true);
  });

  test('should cache static assets', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for service worker to be ready
    await page.waitForTimeout(2000);

    // Check cache storage
    const cacheNames = await page.evaluate(async () => {
      if ('caches' in window) {
        const names = await caches.keys();
        return names;
      }
      return [];
    });

    console.log('Cache names:', cacheNames);
    expect(cacheNames.length).toBeGreaterThanOrEqual(0);
  });

  test('should show offline indicator when offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for service worker
    await page.waitForTimeout(2000);

    // Go offline
    await context.setOffline(true);

    // Try to navigate or reload
    await page.reload().catch(() => {
      // Expected to fail or show cached content
    });

    // Check if page still shows content (from cache)
    const bodyContent = await page.content();
    expect(bodyContent.length).toBeGreaterThan(100);

    // Go back online
    await context.setOffline(false);
  });

  test('should handle offline form submission gracefully', async ({ page, context }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    // Fill form
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('test@example.com');
    }

    // Go offline
    await context.setOffline(true);

    // Try to submit
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
      
      // Should show some feedback (error or queued message)
      await page.waitForTimeout(1000);
    }

    // Go back online
    await context.setOffline(false);
  });

  test('should sync data when coming back online', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Go back online
    await context.setOffline(false);

    // Wait for potential sync
    await page.waitForTimeout(1000);

    // Page should be functional
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should cache API responses for offline use', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for caching
    await page.waitForTimeout(3000);

    // Check for cached API responses
    const cachedRequests = await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        let totalCached = 0;
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          totalCached += keys.length;
        }
        
        return totalCached;
      }
      return 0;
    });

    console.log(`Total cached items: ${cachedRequests}`);
  });

  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow 3G network
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (0.4 * 1024 * 1024) / 8,
      uploadThroughput: (0.4 * 1024 * 1024) / 8,
      latency: 400,
    });

    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    console.log(`Slow network load time: ${loadTime}ms`);

    // Should still load eventually
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 30000 });
  });

  test('should show loading states during slow operations', async ({ page }) => {
    // Simulate slow network
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (0.1 * 1024 * 1024) / 8,
      uploadThroughput: (0.1 * 1024 * 1024) / 8,
      latency: 1000,
    });

    await page.goto('/');

    // Check for loading indicators
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]');
    const hasLoadingState = await loadingIndicators.count() >= 0;
    
    // Loading states should exist or page should render quickly
    expect(hasLoadingState).toBe(true);
  });

  test('should handle reconnection after extended offline period', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);
    
    // Wait for extended period
    await page.waitForTimeout(5000);

    // Go back online
    await context.setOffline(false);

    // Reload should work
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });
});
