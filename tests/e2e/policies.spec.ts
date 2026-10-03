import { expect, test } from '@playwright/test';

const indexable = process.env.PUBLIC_INDEXABLE === 'true';

const policies = [
  {
    slug: 'privacy',
    titles: {
      bg: 'Политика за поверителност',
      en: 'Privacy Policy',
    },
    firstSections: {
      bg: 'Администратор на лични данни',
      en: 'Data controller',
    },
  },
  {
    slug: 'cookies',
    titles: {
      bg: 'Политика за бисквитки и локално съхранение',
      en: 'Cookie & Local Storage Policy',
    },
    firstSections: {
      bg: 'Какво представляват бисквитките',
      en: 'What cookies are',
    },
  },
  {
    slug: 'booking-terms',
    titles: {
      bg: 'Условия за резервация и престой',
      en: 'Booking & Stay Terms',
    },
    firstSections: {
      bg: 'Обхват',
      en: 'Scope',
    },
  },
  {
    slug: 'house-rules',
    titles: {
      bg: 'Правила за престой',
      en: 'House Rules',
    },
    firstSections: {
      bg: 'Настаняване и напускане',
      en: 'Check-in and check-out',
    },
  },
] as const;

for (const locale of ['bg', 'en'] as const) {
  for (const policy of policies) {
    test(`${locale} renders the complete ${policy.slug} policy`, async ({
      page,
    }) => {
      const prefix = locale === 'en' ? '/en' : '';
      await page.goto(`${prefix}/${policy.slug}`);

      const content = page.locator('.policy-content');
      await expect(content.locator('h1')).toHaveText(policy.titles[locale]);
      await expect(content.locator('h2').first()).toHaveText(
        policy.firstSections[locale],
      );
      await expect(content.locator('h2').count()).resolves.toBeGreaterThan(2);
      await expect(content).toContainText('2026');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        indexable ? 'index,follow' : 'noindex,nofollow',
      );

      const otherLocalePath = `${locale === 'en' ? '' : '/en'}/${policy.slug}`;
      await expect(page.locator('.footer-lang-switch')).toHaveAttribute(
        'href',
        otherLocalePath,
      );
    });
  }

  test(`${locale} footer links to all four policy pages`, async ({ page }) => {
    await page.goto(locale === 'en' ? '/en/privacy' : '/privacy');
    const prefix = locale === 'en' ? '/en' : '';
    const links = page.locator('.footer-legal-links a');
    await expect(links).toHaveCount(4);
    for (const policy of policies) {
      await expect(
        page.locator(`.footer-legal-links a[href="${prefix}/${policy.slug}"]`),
      ).toBeVisible();
    }
  });

  test(`${locale} policy pages fit mobile, tablet and desktop widths`, async ({
    page,
  }) => {
    const prefix = locale === 'en' ? '/en' : '';
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const slug of ['privacy', 'booking-terms'] as const) {
        await page.goto(`${prefix}/${slug}`);
        const dimensions = await page.evaluate(() => {
          const article = document.querySelector('.policy-article');
          const rect = article?.getBoundingClientRect();
          return {
            pageWidth: document.documentElement.scrollWidth,
            viewportWidth: document.documentElement.clientWidth,
            articleLeft: rect?.left ?? -1,
            articleRight: rect?.right ?? Infinity,
          };
        });
        expect(dimensions.pageWidth).toBeLessThanOrEqual(
          dimensions.viewportWidth + 1,
        );
        expect(dimensions.articleLeft).toBeGreaterThanOrEqual(0);
        expect(dimensions.articleRight).toBeLessThanOrEqual(width + 1);
      }
    }
  });
}
