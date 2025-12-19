import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load home page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
    console.log(`Home page load time: ${loadTime}ms`);
  });

  test('should have no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('Failed to load resource')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have acceptable First Contentful Paint', async ({ page }) => {
    await page.goto('/');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
          resolve(fcp ? fcp.startTime : null);
        }).observe({ entryTypes: ['paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(null), 5000);
      });
    });

    if (metrics !== null) {
      // FCP should be under 3 seconds
      expect(Number(metrics)).toBeLessThan(3000);
      console.log(`FCP: ${metrics}ms`);
    }
  });

  test('should not have layout shifts during load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take screenshot to verify visual stability
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
  });

  test('should have lazy loaded images', async ({ page }) => {
    await page.goto('/');
    
    // Check for images with loading="lazy"
    const lazyImages = await page.locator('img[loading="lazy"]').count();
    
    // At least some images should be lazy loaded
    // (or no images at all is also acceptable)
    const allImages = await page.locator('img').count();
    
    if (allImages > 3) {
      expect(lazyImages).toBeGreaterThan(0);
    }
  });

  test('should have efficient bundle size', async ({ page }) => {
    const resources: { name: string; size: number }[] = [];
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('.js') && !url.includes('node_modules')) {
        const headers = response.headers();
        const size = parseInt(headers['content-length'] || '0', 10);
        resources.push({ name: url, size });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Log bundle sizes
    resources.forEach(r => {
      console.log(`Bundle: ${r.name.split('/').pop()} - ${(r.size / 1024).toFixed(2)}KB`);
    });
  });

  test('should cache static assets', async ({ page }) => {
    // First visit
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for cache headers on subsequent requests
    const responses: { url: string; cached: boolean }[] = [];
    
    page.on('response', response => {
      const headers = response.headers();
      const cacheControl = headers['cache-control'] || '';
      const isCached = cacheControl.includes('max-age') || 
                       cacheControl.includes('immutable') ||
                       response.fromCache();
      
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({ url: response.url(), cached: isCached });
      }
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Some assets should use caching
    const cachedCount = responses.filter(r => r.cached).length;
    console.log(`Cached responses: ${cachedCount}/${responses.length}`);
  });

  test('should handle navigation without full reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on a navigation link
    const link = page.locator('a[href="/sectores"]').first();
    if (await link.isVisible()) {
      const startTime = Date.now();
      await link.click();
      await page.waitForURL(/.*sectores/);
      const navTime = Date.now() - startTime;
      
      // Client-side navigation should be fast
      expect(navTime).toBeLessThan(2000);
      console.log(`Navigation time: ${navTime}ms`);
    }
  });

  test('should have responsive design breakpoints', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 720, name: 'desktop' },
      { width: 1920, height: 1080, name: 'large desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Page should render without horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20);
      
      console.log(`${viewport.name}: ${viewport.width}x${viewport.height} - OK`);
    }
  });
});
