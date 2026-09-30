import { expect, test, type Page } from '@playwright/test';

async function acceptEnquiry(page: Page) {
  await page.route('**/api/booking', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, message: 'Enquiry accepted.' }),
    }),
  );
}

test.describe('Direct enquiry form', () => {
  test('submits the short Bulgarian stay enquiry and keeps optional fields optional', async ({
    page,
  }) => {
    let submitted: Record<string, unknown> | undefined;
    await page.route('**/api/booking', async (route) => {
      submitted = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: 'Enquiry accepted.' }),
      });
    });

    await page.goto('/booking');
    await page.fill('#checkIn', '2027-07-15');
    await page.fill('#checkOut', '2027-07-20');
    await page.fill('#guests', '2');
    await page.fill('#name', 'Димитър Димитров');
    await page.fill('#email', 'dimitar@example.com');
    await page.fill('#accommodationPreference', 'Тиха част на двора');
    await page.fill('#message', 'Моля за информация за пристигането.');
    await page.locator('#privacyAcknowledged').check();

    await expect(page.locator('#phone')).not.toHaveAttribute('required', '');
    await expect(page.locator('#accommodationPreference')).toHaveAttribute(
      'aria-describedby',
      'accommodationPreference-error',
    );
    await expect(page.locator('#accommodationId, #rooms, #pets')).toHaveCount(
      0,
    );
    await page.getByRole('button', { name: 'Изпрати запитване' }).click();

    const success = page.locator('#booking-success');
    await expect(success).toBeVisible();
    await expect(success).toContainText(/получихме запитването/i);
    expect(submitted).toMatchObject({
      intent: 'stay',
      checkIn: '2027-07-15',
      checkOut: '2027-07-20',
      guests: 2,
      accommodationPreference: 'Тиха част на двора',
      phone: '',
      privacyAcknowledged: 'true',
    });
    expect(submitted).not.toHaveProperty('accommodationId');
    expect(submitted).not.toHaveProperty('rooms');
    expect(submitted).not.toHaveProperty('pets');
  });

  test('supports a general English question without dates, guests or phone', async ({
    page,
  }) => {
    await acceptEnquiry(page);
    await page.goto('/en/booking');
    await page.getByLabel('General question').check();
    await expect(page.locator('#stay-fields')).toBeHidden();
    await page.fill('#name', 'Sarah Jenkins');
    await page.fill('#email', 'sarah@example.co.uk');
    await page.fill('#message', 'Can we arrive after 21:00?');
    await page.locator('#privacyAcknowledged').check();
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('#booking-success')).toBeVisible();
    await expect(page.locator('#booking-success')).toContainText(/received/i);
  });

  test('requires a question and marks the selected dates as preferences', async ({
    page,
  }) => {
    await page.goto('/booking');
    await expect(page.locator('label[for="checkIn"]')).toContainText(
      'Предпочитана дата на пристигане',
    );
    await expect(page.locator('label[for="checkOut"]')).toContainText(
      'Предпочитана дата на отпътуване',
    );
    await page.getByLabel('Общ въпрос').check();
    await page.fill('#name', 'Мария Петрова');
    await page.fill('#email', 'maria@example.com');
    await page.locator('#privacyAcknowledged').check();
    await page.getByRole('button', { name: 'Изпрати съобщение' }).click();
    await expect(page.locator('#message-error')).toBeVisible();
    await expect(page.locator('#booking-success')).toBeHidden();
  });

  test('shows an error and preserves entered values after a delivery failure', async ({
    page,
  }) => {
    await page.route('**/api/booking', async (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, message: 'Please retry later.' }),
      }),
    );
    await page.goto('/en/booking');
    await page.fill('#checkIn', '2027-08-01');
    await page.fill('#checkOut', '2027-08-04');
    await page.fill('#guests', '4');
    await page.fill('#name', 'Casey Guest');
    await page.fill('#email', 'casey@example.com');
    await page.locator('#privacyAcknowledged').check();
    await page.getByRole('button', { name: 'Request a stay' }).click();

    await expect(page.locator('#form-error-alert')).toBeVisible();
    await expect(page.locator('#booking-form')).toBeVisible();
    await expect(page.locator('#checkIn')).toHaveValue('2027-08-01');
    await expect(page.locator('#checkOut')).toHaveValue('2027-08-04');
    await expect(page.locator('#name')).toHaveValue('Casey Guest');
  });

  test('prevents a second submission while the first is pending', async ({
    page,
  }) => {
    let requestCount = 0;
    await page.route('**/api/booking', async (route) => {
      requestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });
    await page.goto('/en/booking');
    await page.fill('#checkIn', '2027-09-01');
    await page.fill('#checkOut', '2027-09-03');
    await page.fill('#guests', '2');
    await page.fill('#name', 'Casey Guest');
    await page.fill('#email', 'casey@example.com');
    await page.locator('#privacyAcknowledged').check();
    const submit = page.locator('#submit-btn');
    await submit.click();
    await expect(submit).toBeDisabled();
    await expect(page.locator('#booking-success')).toBeVisible();
    expect(requestCount).toBe(1);
  });

  test('sets the departure minimum after arrival and validates required fields', async ({
    page,
  }) => {
    await page.goto('/booking');
    await expect(page.locator('#phone')).not.toHaveAttribute('required', '');
    await page.fill('#checkIn', '2027-07-01');
    await expect(page.locator('#checkOut')).toHaveAttribute(
      'min',
      '2027-07-02',
    );
    await page.getByRole('button', { name: 'Изпрати запитване' }).click();
    await expect(page.locator('#name-error')).toBeVisible();
    await expect(page.locator('#booking-success')).toBeHidden();
  });

  test('requires a privacy acknowledgement and links the localized policy', async ({
    page,
  }) => {
    let requestCount = 0;
    await page.route('**/api/booking', async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: 'Enquiry accepted.' }),
      });
    });
    await page.goto('/booking');
    await page.fill('#checkIn', '2027-07-15');
    await page.fill('#checkOut', '2027-07-20');
    await page.fill('#name', 'Димитър Димитров');
    await page.fill('#email', 'dimitar@example.com');
    await expect(page.locator('#privacyAcknowledged')).toHaveAttribute(
      'required',
      '',
    );
    await expect(
      page
        .locator('#booking-form')
        .getByRole('link', { name: 'Политика за поверителност' }),
    ).toHaveAttribute('href', '/privacy');

    await page.getByRole('button', { name: 'Изпрати запитване' }).click();
    await expect(page.locator('#privacyAcknowledged-error')).toBeVisible();
    expect(requestCount).toBe(0);

    await page.locator('#privacyAcknowledged').check();
    await page.getByRole('button', { name: 'Изпрати запитване' }).click();
    await expect(page.locator('#booking-success')).toBeVisible();
    expect(requestCount).toBe(1);
  });

  test('accommodation enquiry links no longer preselect an unverified unit', async ({
    page,
  }) => {
    await page.goto('/accommodation');
    const enquiry = page.locator('.unit-enquire-btn').first();
    await expect(enquiry).toHaveAttribute('href', '/booking');
    await enquiry.click();
    await expect(page).toHaveURL(/\/booking$/);
    await expect(page.locator('#accommodationId, #rooms')).toHaveCount(0);
  });

  test('footer language switch preserves the current page', async ({
    page,
  }) => {
    await page.goto('/booking');
    const footerLink = page.locator('footer a:has-text("English")');
    await expect(footerLink).toHaveAttribute('href', '/en/booking');
    await footerLink.click();
    await expect(page).toHaveURL(/\/en\/booking$/);
  });
});
