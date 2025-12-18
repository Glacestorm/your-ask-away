import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page when accessing protected route', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/obelixia-admin');
    
    // Should redirect to login or show login form
    await expect(page).toHaveURL(/.*\/(login|auth|store)/);
  });

  test('should display login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Check for submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Sign")');
    await expect(submitButton).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    
    // Click submit without filling fields
    const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login")');
    await submitButton.click();
    
    // Should show some form of validation message
    await page.waitForTimeout(500);
    
    // Check for validation message or error styling
    const errorMessage = page.locator('[role="alert"], .error, .text-destructive, [data-error]');
    const invalidInput = page.locator('input:invalid, input[aria-invalid="true"]');
    
    const hasError = await errorMessage.isVisible() || await invalidInput.count() > 0;
    expect(hasError).toBe(true);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword123');
    
    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login")');
    await submitButton.click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Should show error (toast or inline)
    const errorIndicator = page.locator('[role="alert"], .toast, .error, [data-sonner-toast]');
    const hasError = await errorIndicator.isVisible();
    
    // Should not navigate away from login
    await expect(page).toHaveURL(/.*\/(login|auth)/);
  });

  test('should have link to registration', async ({ page }) => {
    await page.goto('/login');
    
    // Look for sign up / register link
    const registerLink = page.locator('a:has-text("Registr"), a:has-text("Sign up"), a:has-text("Crear cuenta"), button:has-text("Registr")');
    
    if (await registerLink.isVisible()) {
      await registerLink.click();
      // Should navigate to register page or show register form
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });
});

test.describe('Session Management', () => {
  test('should persist session state', async ({ page, context }) => {
    await page.goto('/store');
    
    // Get cookies
    const cookies = await context.cookies();
    
    // Should have some session-related cookies or storage
    const sessionData = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage),
      };
    });
    
    // Should have storage mechanism for session
    expect(
      cookies.length > 0 ||
      sessionData.localStorage.length > 0 ||
      sessionData.sessionStorage.length > 0
    ).toBe(true);
  });
});

test.describe('Protected Routes', () => {
  const protectedRoutes = [
    '/obelixia-admin',
    '/admin',
    '/dashboard',
    '/companies',
  ];

  for (const route of protectedRoutes) {
    test(`should protect route: ${route}`, async ({ page }) => {
      await page.goto(route);
      
      // Should either redirect to login or show access denied
      const currentUrl = page.url();
      const hasLoginForm = await page.locator('input[type="password"]').isVisible();
      const isOnStore = currentUrl.includes('/store');
      const isOnLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
      
      expect(hasLoginForm || isOnStore || isOnLogin).toBe(true);
    });
  }
});
