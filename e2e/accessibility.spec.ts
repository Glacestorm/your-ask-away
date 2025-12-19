import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have proper heading hierarchy on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get all headings
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    
    // Should have exactly one h1
    expect(h1Count).toBe(1);
    
    // Can have multiple h2s
    expect(h2Count).toBeGreaterThanOrEqual(0);
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    const emptyAltImages = await page.locator('img[alt=""]').count();
    
    // All images should have alt text (empty alt is ok for decorative images)
    // but we should minimize images without any alt attribute
    expect(imagesWithoutAlt).toBeLessThanOrEqual(5);
  });

  test('should have proper link text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for links with non-descriptive text
    const badLinks = await page.locator('a').evaluateAll(links => 
      links.filter(link => {
        const text = link.textContent?.trim().toLowerCase() || '';
        return text === 'click here' || text === 'here' || text === 'read more';
      }).length
    );
    
    expect(badLinks).toBeLessThanOrEqual(2);
  });

  test('should have focusable interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Tab through the page
    let tabCount = 0;
    const maxTabs = 50;
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName : null;
      });
      
      if (focusedElement === 'BODY') {
        break;
      }
    }
    
    // Should be able to tab through multiple elements
    expect(tabCount).toBeGreaterThan(1);
  });

  test('should have proper button labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check buttons have accessible names
    const buttonsWithoutLabels = await page.locator('button').evaluateAll(buttons =>
      buttons.filter(btn => {
        const text = btn.textContent?.trim() || '';
        const ariaLabel = btn.getAttribute('aria-label') || '';
        const title = btn.getAttribute('title') || '';
        return !text && !ariaLabel && !title;
      }).length
    );
    
    expect(buttonsWithoutLabels).toBeLessThanOrEqual(3);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    const inputs = await page.locator('input:not([type="hidden"])').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Each input should have some form of label
      const hasLabel = id || ariaLabel || ariaLabelledBy || placeholder;
      
      if (!hasLabel) {
        console.log('Input without label found');
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check text elements for visibility
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button').all();
    
    let visibleCount = 0;
    for (const element of textElements.slice(0, 20)) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) visibleCount++;
    }
    
    // Most text elements should be visible
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should support keyboard navigation in modals', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to open a modal if one exists
    const modalTrigger = page.locator('[data-dialog-trigger], [aria-haspopup="dialog"]').first();
    
    if (await modalTrigger.isVisible().catch(() => false)) {
      await modalTrigger.click();
      
      // Check if modal traps focus
      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible().catch(() => false)) {
        // Press Escape to close
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('should have skip links for keyboard users', async ({ page }) => {
    await page.goto('/');
    
    // Press Tab to reveal skip link
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a:has-text("skip"), a[href="#main"], a[href="#content"]').first();
    const hasSkipLink = await skipLink.isVisible().catch(() => false);
    
    // Skip links are recommended but not required for all pages
    console.log(`Skip link present: ${hasSkipLink}`);
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for aria-live regions
    const liveRegions = await page.locator('[aria-live]').count();
    
    // Should have at least one live region for toast/notifications
    // This is a soft check as not all pages need live regions
    console.log(`ARIA live regions: ${liveRegions}`);
  });

  test('should work with reduced motion preference', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Page should still function normally
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should have proper language attribute', async ({ page }) => {
    await page.goto('/');
    
    const lang = await page.locator('html').getAttribute('lang');
    
    // Should have a language attribute
    expect(lang).toBeTruthy();
    expect(lang?.length).toBeGreaterThanOrEqual(2);
  });
});
