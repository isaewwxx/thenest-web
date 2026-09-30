import { expect, test } from '@playwright/test';

test('preview pages, robots and sitemap stay non-indexable', async ({
  page,
  request,
}) => {
  await page.goto('/en/location');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex,nofollow',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);

  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain('Disallow: /');
  expect(await robots.text()).not.toContain('Allow: /');
  expect(await robots.text()).not.toContain('Sitemap:');

  const sitemap = await request.get('/sitemap-index.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).not.toContain('<loc>');
});
