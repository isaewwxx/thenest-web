import { expect, test } from '@playwright/test';

test.describe('Direct booking enquiry flow', () => {
  test('submits a valid direct booking enquiry and displays success state in Bulgarian', async ({
    page,
  }) => {
    await page.goto('/booking');

    await expect(page.locator('main h1')).toContainText(/пишете/i);
    await expect(page.locator('#booking-form')).toBeVisible();

    // Fill in required form fields
    await page.fill('#checkIn', '2027-07-15');
    await page.fill('#checkOut', '2027-07-20');
    await page.selectOption('#guests', '2');
    await page.fill('#name', 'Димитър Димитров');
    await page.fill('#phone', '+359 888 777 666');
    await page.fill('#email', 'dimitar@example.com');
    await page.fill('#message', 'Моля за тиха стая с изглед към градината.');

    // Submit form
    await page.click('#submit-btn');

    // Expect success message to be displayed and form to be hidden
    const successView = page.locator('#booking-success');
    await expect(successView).toBeVisible({ timeout: 10_000 });
    await expect(successView.locator('h3')).toContainText(/изпратено/i);
    await expect(page.locator('#booking-form')).not.toBeVisible();
    await expect(successView.locator('a[href^="tel:"]')).toBeVisible();
  });

  test('submits a valid direct booking enquiry in English', async ({
    page,
  }) => {
    await page.goto('/en/booking');

    await expect(page.locator('main h1')).toContainText(/stay/i);
    await expect(page.locator('#booking-form')).toBeVisible();

    // Fill form
    await page.fill('#checkIn', '2027-08-01');
    await page.fill('#checkOut', '2027-08-07');
    await page.selectOption('#guests', '3');
    await page.fill('#name', 'Sarah Jenkins');
    await page.fill('#phone', '+44 7700 900077');
    await page.fill('#email', 'sarah@example.co.uk');
    await page.fill('#message', 'Traveling with small child.');

    await page.click('#submit-btn');

    const successView = page.locator('#booking-success');
    await expect(successView).toBeVisible({ timeout: 10_000 });
    await expect(successView.locator('h3')).toContainText(
      /enquiry has been sent/i,
    );
  });

  test('preselects accommodation when entering via ?room= query param', async ({
    page,
  }) => {
    await page.goto('/booking?room=bungalow-room');
    const select = page.locator('#accommodationId');
    await expect(select).toHaveValue('bungalow-room');
  });

  test('preselects accommodation when entering via ?unit= fallback query param', async ({
    page,
  }) => {
    await page.goto('/booking?unit=bungalow-room');
    const select = page.locator('#accommodationId');
    await expect(select).toHaveValue('bungalow-room');
  });

  test('accommodation card enquire CTA links to booking with ?room= parameter', async ({
    page,
  }) => {
    await page.goto('/accommodation');
    const enquireBtn = page.locator('.unit-enquire-btn').first();
    await expect(enquireBtn).toHaveAttribute(
      'href',
      /\/booking\?room=bungalow-room/,
    );
    await enquireBtn.click();
    await expect(page).toHaveURL(/\/booking\?room=bungalow-room/);
    const select = page.locator('#accommodationId');
    await expect(select).toHaveValue('bungalow-room');
  });

  test('preselects rooms when entering via query param', async ({ page }) => {
    await page.goto('/booking?rooms=3');
    const roomsSelect = page.locator('#rooms');
    await expect(roomsSelect).toHaveValue('3');
  });

  test('submits direct enquiry with specific room count', async ({ page }) => {
    await page.goto('/booking');
    await page.fill('#checkIn', '2027-07-01');
    await page.fill('#checkOut', '2027-07-06');
    await page.selectOption('#guests', '4');
    await page.selectOption('#rooms', '2');
    await page.fill('#name', 'Мария Петрова');
    await page.fill('#phone', '+359 888 112 233');
    await page.fill('#email', 'maria@example.com');
    await page.click('#submit-btn');

    const successView = page.locator('#booking-success');
    await expect(successView).toBeVisible({ timeout: 10_000 });
  });

  test('footer language switch preserves current page', async ({ page }) => {
    await page.goto('/booking');
    const footerLink = page.locator('footer a:has-text("English")');
    await expect(footerLink).toHaveAttribute('href', '/en/booking');
    await footerLink.click();
    expect(new URL(page.url()).pathname).toBe('/en/booking');
  });

  test('validates required fields on client side and prevents submission with empty inputs', async ({
    page,
  }) => {
    await page.goto('/booking');
    await page.click('#submit-btn');

    // Expect error messages to appear
    await expect(page.locator('#checkIn-error')).toBeVisible();
    await expect(page.locator('#booking-form')).toBeVisible();
    await expect(page.locator('#booking-success')).not.toBeVisible();
  });
});
