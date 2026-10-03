import { expect, test } from '@playwright/test';

const indexable = process.env.PUBLIC_INDEXABLE === 'true';

test('home includes share metadata and truthful lodging structured data', async ({
  page,
}) => {
  await page.goto('/');

  if (!indexable) {
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
    await expect(
      page.locator('script[type="application/ld+json"]'),
    ).toHaveCount(0);
    return;
  }

  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /^https:\/\/thenestlozenets\.eu\/_astro\//,
  );
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    'content',
    'Бунгало с цветни храсти и дървена веранда',
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );

  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((script) => JSON.parse(script.textContent ?? '{}'));
  expect(structuredData).toMatchObject({
    '@type': 'LodgingBusiness',
    name: 'Бунгала Гнездото',
    url: 'https://thenestlozenets.eu/',
    telephone: '+359 877 116 050',
  });
  expect(structuredData).not.toHaveProperty('aggregateRating');
  expect(structuredData).not.toHaveProperty('review');
});

test('404 response is excluded from indexing and has no homepage canonical', async ({
  page,
}) => {
  const response = await page.goto('/seo-test-route-that-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,nofollow',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
});
