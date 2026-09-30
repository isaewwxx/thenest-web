import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const locales = ['bg', 'en'] as const;
const pagePaths = [
  '',
  '/accommodation',
  '/gallery',
  '/location',
  '/booking',
  '/contact',
];
const widths = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const route = (locale: (typeof locales)[number], path: string) =>
  `${locale === 'en' ? '/en' : ''}${path}` || '/';
const normalizedPath = (path: string) => path.replace(/\/$/, '') || '/';

async function expectNoOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
}

for (const locale of locales) {
  for (const path of pagePaths) {
    const url = route(locale, path);

    test(`${url} has accessible localized content and valid local links`, async ({
      page,
      request,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const response = await page.goto(url);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator('main h1')).not.toBeEmpty();
      await expect(page).toHaveTitle(/\S+/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /\S+/,
      );
      await expect(page.locator('body')).not.toContainText(
        /\bTODO\b|undefined|NaN/,
      );

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);

      const hrefs = await page
        .locator('a[href]')
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute('href') ?? ''),
        );
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of [...new Set(hrefs)]) {
        expect(href).not.toMatch(/^(?:#|)$|undefined|null|javascript:/i);
        if (/^(?:tel:|mailto:)/.test(href)) {
          expect(href.split(':').slice(1).join(':').trim()).not.toBe('');
        }
        const target = new URL(href, page.url());
        if (target.origin === new URL(page.url()).origin) {
          expect((await request.get(target.href)).ok(), target.href).toBe(true);
        }
      }
      expect(errors).toEqual([]);
    });

    test(`${url} uses the approved hero photography`, async ({ page }) => {
      await page.goto(url);
      if (path === '') {
        await expect(page.locator('.hero-img')).toHaveAttribute(
          'data-photo-id',
          'bungalow-garden-veranda',
        );
      }
    });

    test(`${url} switches to its equivalent translated page`, async ({
      page,
    }) => {
      await page.goto(url);
      const language = page.getByRole('link', {
        name: locale === 'bg' ? 'English' : 'Български',
        exact: true,
      });
      await language.first().click();
      const destination = route(locale === 'bg' ? 'en' : 'bg', path);
      await expect
        .poll(() => normalizedPath(new URL(page.url()).pathname))
        .toBe(normalizedPath(destination));
    });
  }

  for (const width of widths) {
    test(`${locale} pages fit ${width}px without horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of pagePaths) {
        await page.goto(route(locale, path));
        await page.evaluate(() => document.fonts.ready);
        await expectNoOverflow(page);
        await expect(page.locator('main h1')).toBeVisible();
      }
    });
  }

  test(`${locale} mobile menu supports Escape and restores focus`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route(locale, ''));
    const menu = page.locator('header .menu-label').filter({
      hasText: locale === 'bg' ? 'Меню' : 'Menu',
    });
    await expect(menu).toBeVisible();
    await menu.click();
    const trigger = page.locator('header .mobile-nav > summary');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
    await expectNoOverflow(page);
  });

  test(`${locale} gallery has an accessible keyboard lightbox or a safe empty state`, async ({
    page,
  }) => {
    await page.goto(route(locale, '/gallery'));
    const images = page.locator('a[data-lightbox]');
    const dialog = page.getByRole('dialog');
    const count = await images.count();
    if (count === 0) {
      await expect(dialog).not.toBeVisible();
      await expect(page.locator('main')).not.toBeEmpty();
      return;
    }

    await images.first().focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(
      locale === 'bg' ? /галерия/i : /gallery/i,
    );
    await expect(dialog.locator('img')).toHaveAttribute('alt', /\S+/);
    const initialImage = await dialog.locator('img').getAttribute('src');
    if (count > 1) {
      await page.keyboard.press('ArrowRight');
      await expect(dialog.locator('img')).not.toHaveAttribute(
        'src',
        initialImage ?? '',
      );
      await page.keyboard.press('ArrowLeft');
      await expect(dialog.locator('img')).toHaveAttribute(
        'src',
        initialImage ?? '',
      );
      await dialog
        .getByRole('button', {
          name: locale === 'bg' ? 'Следваща снимка' : 'Next image',
          exact: true,
        })
        .click();
      await expect(dialog.locator('img')).not.toHaveAttribute(
        'src',
        initialImage ?? '',
      );
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(images.first()).toBeFocused();
    await images.first().click();
    await dialog
      .getByRole('button', {
        name: locale === 'bg' ? 'Затвори' : 'Close',
        exact: true,
      })
      .click();
    await expect(dialog).not.toBeVisible();
  });

  test(`${locale} remains navigable without JavaScript`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 812 },
      baseURL: 'http://localhost:4321',
    });
    const page = await context.newPage();
    await page.goto(route(locale, ''));
    await page.locator('header .menu-label').click();
    const accommodation = page.locator(
      `a[href="${route(locale, '/accommodation')}"]`,
    );
    await accommodation.first().click();
    await expect
      .poll(() => normalizedPath(new URL(page.url()).pathname))
      .toBe(route(locale, '/accommodation'));
    await expect(page.locator('main h1')).toBeVisible();
    await context.close();
  });

  test(`${locale} respects reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route(locale, ''));
    await expect(page.locator('main h1')).toBeVisible();
    const motion = await page.evaluate(() => {
      const durations = Array.from(document.querySelectorAll('*')).flatMap(
        (element) => {
          const style = getComputedStyle(element);
          return [
            ...style.animationDuration.split(','),
            ...style.transitionDuration.split(','),
          ].map((duration) => Number.parseFloat(duration) || 0);
        },
      );
      return {
        longest: Math.max(0, ...durations),
        scroll: getComputedStyle(document.documentElement).scrollBehavior,
      };
    });
    expect(motion.longest).toBeLessThanOrEqual(0.01);
    expect(motion.scroll).not.toBe('smooth');
  });

  test(`${locale} links to current guest feedback without stale ratings`, async ({
    page,
  }) => {
    await page.goto(route(locale, ''));
    const reviewsSection = page.locator('.reviews-section');
    await expect(reviewsSection).toBeVisible();
    await expect(reviewsSection.locator('.platform-link')).toHaveCount(2);
    await expect(reviewsSection).not.toContainText(/10\.0|5\.0|4 500\+/);
    await expect(reviewsSection.locator('a[href*="booking.com"]')).toHaveCount(
      1,
    );
    await expect(reviewsSection.locator('a[href*="airbnb.com"]')).toHaveCount(
      1,
    );
  });

  test(`${locale} accommodation page displays structured amenities and check-in policies`, async ({
    page,
  }) => {
    await page.goto(route(locale, '/accommodation'));
    const amenities = page.locator(
      '.necessities-section:first-of-type .necessity-item',
    );
    await expect(amenities.first()).toBeVisible();
    expect(await amenities.count()).toBeGreaterThan(5);
    const policies = page.locator('.policy-list');
    await expect(policies).toBeVisible();
    await expect(policies).toContainText(/14:00/);
    await expect(policies).toContainText(/10:00/);
  });

  test(`${locale} gallery category filter updates active state and filters items`, async ({
    page,
  }) => {
    await page.goto(route(locale, '/gallery'));
    const brandFilter = page.locator('button[data-category-filter="brand"]');
    await expect(brandFilter).toBeVisible();
    await brandFilter.click();
    await expect(brandFilter).toHaveAttribute('aria-pressed', 'true');
    const visiblePhotos = page.locator('.gallery-item:visible');
    const visibleCount = await visiblePhotos.count();
    expect(visibleCount).toBeGreaterThanOrEqual(1);
  });
}
