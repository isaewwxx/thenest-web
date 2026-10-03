import { expect, test } from '@playwright/test';

const indexable = process.env.PUBLIC_INDEXABLE === 'true';

test('page metadata, robots and sitemap match the build indexing mode', async ({
  page,
  request,
}) => {
  await page.goto('/en/location');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    indexable ? 'index,follow' : 'noindex,nofollow',
  );
  if (indexable) {
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://thenestlozenets.eu/en/location',
    );
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
      2,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://thenestlozenets.eu/en/location',
    );
  } else {
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
      0,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  }

  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  if (indexable) {
    expect(await robots.text()).toContain('Allow: /');
    expect(await robots.text()).toContain(
      'Sitemap: https://thenestlozenets.eu/sitemap-index.xml',
    );
  } else {
    expect(await robots.text()).toContain('Disallow: /');
    expect(await robots.text()).not.toContain('Allow: /');
    expect(await robots.text()).not.toContain('Sitemap:');
  }

  const sitemap = await request.get('/sitemap-index.xml');
  expect(sitemap.ok()).toBe(true);
  if (indexable) {
    expect(await sitemap.text()).toContain('<loc>');
    expect((await sitemap.text()).match(/<loc>/g)).toHaveLength(20);
  } else {
    expect(await sitemap.text()).not.toContain('<loc>');
  }
});
